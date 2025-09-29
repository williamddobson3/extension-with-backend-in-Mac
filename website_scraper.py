#!/usr/bin/env python3
"""
Website Scraper & Change Detector
A powerful, multi-method website scraping tool that can detect content changes and send notifications to users.
"""

import os
import sys
import time
import hashlib
import logging
import asyncio
import aiohttp
import requests
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urlparse
from dataclasses import dataclass
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import mysql.connector
from mysql.connector import Error
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ScrapingResult:
    """Result of a scraping operation"""
    success: bool
    content: Optional[str] = None
    status_code: Optional[int] = None
    response_time: Optional[float] = None
    method: Optional[str] = None
    error: Optional[str] = None
    headers: Optional[Dict] = None

@dataclass
class ChangeResult:
    """Result of change detection"""
    has_changed: bool
    reason: str
    current_hash: Optional[str] = None
    previous_hash: Optional[str] = None
    change_type: Optional[str] = None
    current_keywords: Optional[bool] = None
    previous_keywords: Optional[bool] = None

class DatabaseManager:
    """Manages database connections and operations"""
    
    def __init__(self, config: Dict[str, str]):
        self.config = config
        self.connection = None
        
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = mysql.connector.connect(
                host=self.config['DB_HOST'],
                user=self.config['DB_USER'],
                password=self.config['DB_PASSWORD'],
                database=self.config['DB_NAME'],
                charset='utf8mb4',
                collation='utf8mb4_unicode_ci'
            )
            logger.info("✅ Database connection successful")
            return True
        except Error as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info("🔒 Database connection closed")
    
    def execute_query(self, query: str, params: Tuple = None):
        """Execute a database query"""
        try:
            if not self.connection or not self.connection.is_connected():
                if not self.connect():
                    return None
                    
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params)
            
            if query.strip().upper().startswith('SELECT'):
                result = cursor.fetchall()
            else:
                self.connection.commit()
                result = cursor.lastrowid
                
            cursor.close()
            return result
            
        except Error as e:
            logger.error(f"Database query error: {e}")
            return None

class NotificationService:
    """Handles sending notifications via email and LINE"""
    
    def __init__(self, config: Dict[str, str]):
        self.config = config
        self.email_config = {
            'host': config.get('EMAIL_HOST'),
            'port': int(config.get('EMAIL_PORT', 465)),
            'user': config.get('EMAIL_USER'),
            'password': config.get('EMAIL_PASS'),
            'secure': config.get('EMAIL_PORT') == '465'
        }
        
    def send_email(self, to_email: str, subject: str, message: str, html_message: str = None) -> bool:
        """Send email notification"""
        try:
            if not all([self.email_config['host'], self.email_config['user'], self.email_config['password']]):
                logger.warning("Email configuration incomplete")
                return False
                
            msg = MIMEMultipart('alternative')
            msg['From'] = self.email_config['user']
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add both plain text and HTML versions
            text_part = MIMEText(message, 'plain', 'utf-8')
            msg.attach(text_part)
            
            if html_message:
                html_part = MIMEText(html_message, 'html', 'utf-8')
                msg.attach(html_part)
            
            # Connect to SMTP server
            if self.email_config['secure']:
                server = smtplib.SMTP_SSL(self.email_config['host'], self.email_config['port'])
            else:
                server = smtplib.SMTP(self.email_config['host'], self.email_config['port'])
                server.starttls()
            
            server.login(self.email_config['user'], self.email_config['password'])
            server.send_message(msg)
            server.quit()
            
            logger.info(f"✅ Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send email to {to_email}: {e}")
            return False
    
    def send_line_notification(self, line_user_id: str, message: str) -> bool:
        """Send LINE notification (placeholder for LINE API integration)"""
        try:
            # TODO: Implement LINE Messaging API
            logger.info(f"📱 LINE notification would be sent to {line_user_id}: {message}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to send LINE notification: {e}")
            return False

class WebsiteScraper:
    """Main website scraping class with multiple methods"""
    
    def __init__(self, config: Dict[str, str]):
        self.config = config
        self.db = DatabaseManager(config)
        self.notification_service = NotificationService(config)
        self.driver = None
        
        # User agents for different browsers
        self.user_agents = {
            'chrome': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'firefox': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'safari': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
        }
        
        # Default headers
        self.default_headers = {
            'User-Agent': self.user_agents['chrome'],
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    
    def __del__(self):
        """Cleanup when object is destroyed"""
        self.cleanup()
    
    def cleanup(self):
        """Clean up resources"""
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass
        if self.db:
            self.db.disconnect()
    
    def init_selenium_driver(self):
        """Initialize Selenium WebDriver"""
        try:
            chrome_options = Options()
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--user-agent=' + self.user_agents['chrome'])
            
            self.driver = webdriver.Chrome(options=chrome_options)
            logger.info("✅ Selenium WebDriver initialized")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to initialize Selenium WebDriver: {e}")
            return False
    
    def scrape_with_requests(self, url: str) -> ScrapingResult:
        """Scrape website using requests library (fastest method)"""
        start_time = time.time()
        
        try:
            response = requests.get(
                url,
                headers=self.default_headers,
                timeout=30,
                allow_redirects=True,
                verify=False  # Skip SSL verification for problematic sites
            )
            
            response_time = time.time() - start_time
            
            return ScrapingResult(
                success=True,
                content=response.text,
                status_code=response.status_code,
                response_time=response_time,
                method='requests',
                headers=dict(response.headers)
            )
            
        except Exception as e:
            return ScrapingResult(
                success=False,
                error=str(e),
                method='requests'
            )
    
    def scrape_with_aiohttp(self, url: str) -> ScrapingResult:
        """Scrape website using aiohttp (async method)"""
        start_time = time.time()
        
        async def _scrape():
            try:
                async with aiohttp.ClientSession(
                    headers=self.default_headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as session:
                    async with session.get(url) as response:
                        content = await response.text()
                        response_time = time.time() - start_time
                        
                        return ScrapingResult(
                            success=True,
                            content=content,
                            status_code=response.status,
                            response_time=response_time,
                            method='aiohttp',
                            headers=dict(response.headers)
                        )
            except Exception as e:
                return ScrapingResult(
                    success=False,
                    error=str(e),
                    method='aiohttp'
                )
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(_scrape())
        finally:
            loop.close()
        
        return result
    
    def scrape_with_selenium(self, url: str) -> ScrapingResult:
        """Scrape website using Selenium (for JavaScript-heavy sites)"""
        start_time = time.time()
        
        try:
            if not self.driver:
                if not self.init_selenium_driver():
                    return ScrapingResult(
                        success=False,
                        error="Failed to initialize WebDriver",
                        method='selenium'
                    )
            
            self.driver.get(url)
            
            # Wait for page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Additional wait for dynamic content
            time.sleep(2)
            
            content = self.driver.page_source
            response_time = time.time() - start_time
            
            return ScrapingResult(
                success=True,
                content=content,
                status_code=200,  # Selenium doesn't provide status codes
                response_time=response_time,
                method='selenium'
            )
            
        except Exception as e:
            return ScrapingResult(
                success=False,
                error=str(e),
                method='selenium'
            )
    
    def smart_scrape(self, url: str) -> ScrapingResult:
        """Smart scraping that tries different methods"""
        logger.info(f"🔍 Scraping: {url}")
        
        # Try requests first (fastest)
        result = self.scrape_with_requests(url)
        if result.success:
            logger.info(f"   ✅ Requests successful ({result.response_time:.2f}s)")
            return result
        
        # Try aiohttp
        logger.info("   ⏳ Requests failed, trying aiohttp...")
        result = self.scrape_with_aiohttp(url)
        if result.success:
            logger.info(f"   ✅ aiohttp successful ({result.response_time:.2f}s)")
            return result
        
        # Try Selenium for JavaScript-heavy sites
        logger.info("   ⏳ aiohttp failed, trying Selenium...")
        result = self.scrape_with_selenium(url)
        if result.success:
            logger.info(f"   ✅ Selenium successful ({result.response_time:.2f}s)")
            return result
        
        # All methods failed
        logger.info("   ❌ All scraping methods failed")
        return result
    
    def extract_text_content(self, html: str, method: str) -> str:
        """Extract and clean text content from HTML"""
        try:
            if method == 'selenium':
                # For Selenium, we already have rendered content
                return self.clean_text(html)
            
            # For other methods, parse with BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            
            # Remove unwanted elements
            for element in soup(['script', 'style', 'noscript', 'iframe', 'img', 'svg', 'canvas', 'audio', 'video']):
                element.decompose()
            
            # Get text content
            text = soup.get_text()
            return self.clean_text(text)
            
        except Exception as e:
            logger.error(f"Error extracting text content: {e}")
            return self.clean_text(html)
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text content"""
        if not text:
            return ""
        
        # Normalize whitespace
        text = ' '.join(text.split())
        
        # Remove special characters but keep CJK characters
        import re
        # Keep alphanumeric, spaces, and CJK characters
        text = re.sub(r'[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\uF900-\uFAFF\u3300-\u33FF\uFE30-\uFE4F\uFF00-\uFFEF\u0020-\u007F]', ' ', text)
        
        return text.strip()
    
    def generate_hash(self, content: str) -> str:
        """Generate MD5 hash of content"""
        return hashlib.md5(content.encode('utf-8')).hexdigest()
    
    def check_keywords(self, content: str, keywords: str) -> Dict[str, Any]:
        """Check for keywords in content"""
        if not keywords or not content:
            return {'found': False, 'keywords': [], 'total': 0}
        
        keyword_list = [k.strip().lower() for k in keywords.split(',')]
        content_lower = content.lower()
        
        found_keywords = [keyword for keyword in keyword_list if keyword in content_lower]
        
        return {
            'found': len(found_keywords) > 0,
            'keywords': found_keywords,
            'total': len(keyword_list)
        }
    
    def save_scraping_result(self, site_id: int, content_hash: str, content_length: int, 
                           status_code: int, response_time: float, keywords_found: bool) -> Optional[int]:
        """Save scraping result to database"""
        try:
            query = """
                INSERT INTO site_checks (site_id, content_hash, content_length, status_code, response_time_ms, changes_detected) 
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            params = (site_id, content_hash, content_length, status_code, int(response_time * 1000), keywords_found)
            
            result = self.db.execute_query(query, params)
            
            # Update last check time
            update_query = "UPDATE monitored_sites SET last_check = NOW() WHERE id = %s"
            self.db.execute_query(update_query, (site_id,))
            
            return result
            
        except Exception as e:
            logger.error(f"Error saving scraping result: {e}")
            return None
    
    def detect_changes(self, site_id: int) -> ChangeResult:
        """Detect changes by comparing with previous scrapes"""
        try:
            query = """
                SELECT content_hash, changes_detected, created_at 
                FROM site_checks 
                WHERE site_id = %s 
                ORDER BY created_at DESC 
                LIMIT 2
            """
            
            checks = self.db.execute_query(query, (site_id,))
            
            if not checks or len(checks) < 2:
                return ChangeResult(
                    has_changed=False,
                    reason='Not enough data for comparison',
                    current_hash=checks[0]['content_hash'] if checks else None
                )
            
            current = checks[0]
            previous = checks[1]
            
            # Check content hash changes
            if current['content_hash'] != previous['content_hash']:
                return ChangeResult(
                    has_changed=True,
                    reason='Content has changed',
                    current_hash=current['content_hash'],
                    previous_hash=previous['content_hash'],
                    change_type='content'
                )
            
            # Check keyword changes
            if current['changes_detected'] != previous['changes_detected']:
                direction = 'appeared' if current['changes_detected'] else 'disappeared'
                return ChangeResult(
                    has_changed=True,
                    reason=f'Keywords {direction}',
                    current_keywords=current['changes_detected'],
                    previous_keywords=previous['changes_detected'],
                    change_type='keywords'
                )
            
            return ChangeResult(
                has_changed=False,
                reason='No changes detected'
            )
            
        except Exception as e:
            logger.error(f"Error detecting changes: {e}")
            return ChangeResult(
                has_changed=False,
                reason=f'Error: {str(e)}'
            )
    
    def get_users_watching_site(self, site_id: int) -> List[Dict]:
        """Get all users watching a specific site"""
        try:
            query = """
                SELECT DISTINCT u.id, u.email, u.line_user_id, un.email_enabled, un.line_enabled
                FROM users u
                JOIN monitored_sites ms ON u.id = ms.user_id
                LEFT JOIN user_notifications un ON u.id = un.user_id
                WHERE ms.id = %s AND u.is_active = TRUE
            """
            
            users = self.db.execute_query(query, (site_id,))
            
            if not users:
                return []
            
            # Set default preferences if none exist
            for user in users:
                user['email_enabled'] = user['email_enabled'] if user['email_enabled'] is not None else True
                user['line_enabled'] = user['line_enabled'] if user['line_enabled'] is not None else False
            
            return users
            
        except Exception as e:
            logger.error(f"Error getting users watching site: {e}")
            return []
    
    def send_notifications(self, site_id: int, change_result: ChangeResult) -> Dict[str, Any]:
        """Send notifications to all users watching a site"""
        try:
            # Get site information
            site_query = "SELECT id, name, url FROM monitored_sites WHERE id = %s"
            sites = self.db.execute_query(site_query, (site_id,))
            
            if not sites:
                return {'success': False, 'reason': 'Site not found'}
            
            site = sites[0]
            
            # Get users watching this site
            users = self.get_users_watching_site(site_id)
            
            if not users:
                return {'success': False, 'reason': 'No users watching site'}
            
            # Create notification message
            message = self.create_change_notification_message(site, change_result)
            
            # Send notifications to each user
            results = []
            for user in users:
                user_result = {'user_id': user['id'], 'email': user['email'], 'success': False}
                
                try:
                    # Send email notification if enabled
                    if user['email_enabled'] and user['email']:
                        email_success = self.notification_service.send_email(
                            user['email'],
                            'Website Update Detected',
                            message,
                            self.create_html_notification(site, change_result)
                        )
                        user_result['email_success'] = email_success
                        user_result['success'] = email_success
                    
                    # Send LINE notification if enabled
                    if user['line_enabled'] and user['line_user_id']:
                        line_success = self.notification_service.send_line_notification(
                            user['line_user_id'],
                            message
                        )
                        user_result['line_success'] = line_success
                        user_result['success'] = user_result['success'] or line_success
                    
                except Exception as e:
                    logger.error(f"Failed to notify user {user['id']}: {e}")
                    user_result['error'] = str(e)
                
                results.append(user_result)
            
            # Calculate summary
            success_count = sum(1 for r in results if r['success'])
            failure_count = len(results) - success_count
            
            logger.info(f"📊 Notification summary for site '{site['name']}':")
            logger.info(f"   ✅ Successfully notified: {success_count} users")
            logger.info(f"   ❌ Failed to notify: {failure_count} users")
            
            return {
                'success': True,
                'site_name': site['name'],
                'total_users': len(users),
                'success_count': success_count,
                'failure_count': failure_count,
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Error sending notifications: {e}")
            return {'success': False, 'error': str(e)}
    
    def create_change_notification_message(self, site: Dict, change_result: ChangeResult) -> str:
        """Create a detailed notification message"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        change_reason = 'コンテンツが更新されました'
        if change_result.reason:
            if 'Keywords appeared' in change_result.reason:
                change_reason = '新しいキーワードが検出されました'
            elif 'Keywords disappeared' in change_result.reason:
                change_reason = 'ページコンテンツが変更されました'
            elif 'Content changed' in change_result.reason:
                change_reason = 'ページコンテンツが変更されました'
        
        return f"""🌐 ウェブサイト更新が検出されました！

📊 サイト: {site['name']}
🌐 URL: {site['url']}
🔄 変更: {change_reason}
🕐 検出時刻: {timestamp}

監視中のウェブサイトが更新されました。最新情報をご確認ください。

この通知は、ウェブサイト監視システムによって自動的に送信されました。"""
    
    def create_html_notification(self, site: Dict, change_result: ChangeResult) -> str:
        """Create HTML version of notification"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        change_reason = 'コンテンツが更新されました'
        if change_result.reason:
            if 'Keywords appeared' in change_result.reason:
                change_reason = '新しいキーワードが検出されました'
            elif 'Keywords disappeared' in change_result.reason:
                change_reason = 'キーワードが削除されました'
            elif 'Content changed' in change_result.reason:
                change_reason = 'ページコンテンツが変更されました'
        
        return f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #007bff 0%, #6610f2 100%); color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">🌐 ウェブサイト監視システム</h1>
                <p style="margin: 10px 0 0 0;">更新が検出されました</p>
            </div>
            
            <div style="padding: 20px; background: #f9f9f9;">
                <h2 style="color: #333;">🔔 ウェブサイト更新が検出されました</h2>
                
                <div style="background: white; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
                    <h3 style="color: #333; margin-top: 0;">📊 サイト詳細</h3>
                    <p><strong>サイト名:</strong> {site['name']}</p>
                    <p><strong>URL:</strong> <a href="{site['url']}" style="color: #007bff;">{site['url']}</a></p>
                    <p><strong>変更:</strong> {change_reason}</p>
                    <p><strong>検出時刻:</strong> {timestamp}</p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    監視中のウェブサイトが更新されました。最新情報をご確認ください。
                </p>
            </div>
            
            <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">© 2024 ウェブサイト監視システム. All rights reserved.</p>
            </div>
        </div>
        """
    
    def scrape_and_detect_changes(self, site_id: int, url: str, keywords: str = None) -> Dict[str, Any]:
        """Main function to scrape a site and detect changes"""
        try:
            logger.info(f"\n🌐 Processing site ID: {site_id}")
            logger.info(f"   URL: {url}")
            logger.info(f"   Keywords: {keywords or 'None'}")
            
            # Scrape the website
            scrape_result = self.smart_scrape(url)
            
            if not scrape_result.success:
                logger.info(f"   ❌ Scraping failed: {scrape_result.error}")
                
                # Save failed attempt
                self.save_scraping_result(
                    site_id, None, 0, 
                    scrape_result.status_code or 0, 0, False
                )
                
                return {
                    'success': False,
                    'error': scrape_result.error,
                    'method': scrape_result.method
                }
            
            # Extract and process content
            text_content = self.extract_text_content(scrape_result.content, scrape_result.method)
            content_hash = self.generate_hash(text_content)
            content_length = len(text_content)
            keywords_result = self.check_keywords(text_content, keywords)
            
            logger.info(f"   📊 Content length: {content_length} characters")
            logger.info(f"   🔑 Keywords: {'Found ' + str(len(keywords_result['keywords'])) + '/' + str(keywords_result['total']) if keywords_result['found'] else 'None found'}")
            logger.info(f"   ⏱️ Response time: {scrape_result.response_time:.2f}s")
            logger.info(f"   📝 Method: {scrape_result.method}")
            
            # Save result to database
            self.save_scraping_result(
                site_id, content_hash, content_length,
                scrape_result.status_code, scrape_result.response_time,
                keywords_result['found']
            )
            
            # Detect changes
            change_result = self.detect_changes(site_id)
            
            if change_result.has_changed:
                logger.info(f"   🔔 CHANGES DETECTED: {change_result.reason}")
                
                # Send notifications
                notification_result = self.send_notifications(site_id, change_result)
                
                if notification_result['success']:
                    logger.info(f"   📧 Notifications sent: {notification_result['success_count']}/{notification_result['total_users']} users")
                else:
                    logger.info(f"   ❌ Notification failed: {notification_result.get('reason', 'Unknown error')}")
            else:
                logger.info(f"   ✅ No changes detected")
            
            return {
                'success': True,
                'content_hash': content_hash,
                'content_length': content_length,
                'status_code': scrape_result.status_code,
                'response_time': scrape_result.response_time,
                'keywords_found': keywords_result['found'],
                'keywords': keywords_result['keywords'],
                'has_changed': change_result.has_changed,
                'change_reason': change_result.reason,
                'method': scrape_result.method,
                'text_preview': text_content[:200] + '...' if len(text_content) > 200 else text_content
            }
            
        except Exception as e:
            logger.error(f"❌ Error processing site {site_id}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def scrape_all_sites(self) -> List[Dict[str, Any]]:
        """Scrape all active sites in the database"""
        try:
            logger.info('\n🚀 Starting bulk scraping of all active sites...\n')
            
            query = """
                SELECT id, name, url, keywords, check_interval_hours, last_check 
                FROM monitored_sites 
                WHERE is_active = TRUE 
                ORDER BY last_check ASC NULLS FIRST
            """
            
            sites = self.db.execute_query(query)
            
            if not sites:
                logger.info('❌ No active sites found in database')
                return []
            
            logger.info(f"📊 Found {len(sites)} active sites to scrape\n")
            
            results = []
            for site in sites:
                try:
                    result = self.scrape_and_detect_changes(
                        site['id'], site['url'], site['keywords']
                    )
                    
                    results.append({
                        'site_id': site['id'],
                        'site_name': site['name'],
                        'success': result['success'],
                        'has_changed': result.get('has_changed', False),
                        'change_reason': result.get('change_reason'),
                        'method': result.get('method'),
                        'error': result.get('error')
                    })
                    
                    # Add delay between requests to be respectful
                    time.sleep(2)
                    
                except Exception as e:
                    logger.error(f"❌ Failed to process site {site['name']}: {e}")
                    results.append({
                        'site_id': site['id'],
                        'site_name': site['name'],
                        'success': False,
                        'error': str(e)
                    })
            
            # Print summary
            self.print_summary(results)
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Error in bulk scraping: {e}")
            return []
    
    def print_summary(self, results: List[Dict[str, Any]]):
        """Print scraping summary"""
        logger.info('\n📋 Scraping Summary')
        logger.info('===================')
        
        successful = [r for r in results if r['success']]
        failed = [r for r in results if not r['success']]
        changed = [r for r in results if r['success'] and r.get('has_changed', False)]
        
        logger.info(f"✅ Successful scrapes: {len(successful)}")
        logger.info(f"❌ Failed scrapes: {len(failed)}")
        logger.info(f"🔔 Sites with changes: {len(changed)}")
        
        if changed:
            logger.info('\n🔄 Sites with detected changes:')
            for site in changed:
                logger.info(f"   • {site['site_name']}: {site['change_reason']}")
        
        if failed:
            logger.info('\n❌ Failed sites:')
            for site in failed:
                logger.info(f"   • {site['site_name']}: {site['error']}")
        
        logger.info('\n🎉 Scraping session completed!')

def load_config() -> Dict[str, str]:
    """Load configuration from environment variables"""
    config = {}
    
    # Database configuration
    config['DB_HOST'] = os.getenv('DB_HOST', 'localhost')
    config['DB_USER'] = os.getenv('DB_USER', 'backend_user')
    config['DB_PASSWORD'] = os.getenv('DB_PASSWORD', 'cupideroskama200334!`#QWE')
    config['DB_NAME'] = os.getenv('DB_NAME', 'website_monitor')
    
    # Email configuration
    config['EMAIL_HOST'] = os.getenv('EMAIL_HOST', '142.250.185.109')
    config['EMAIL_PORT'] = os.getenv('EMAIL_PORT', '465')
    config['EMAIL_USER'] = os.getenv('EMAIL_USER', 'KM@sabosuku.com')
    config['EMAIL_PASS'] = os.getenv('EMAIL_PASS', 'hzpw wojd xszu ladn')
    
    # Admin configuration
    config['ADMIN_EMAIL'] = os.getenv('ADMIN_EMAIL', 'KM@sabosuku.com')
    config['ADMIN_NOTIFICATIONS_ENABLED'] = os.getenv('ADMIN_NOTIFICATIONS_ENABLED', 'true')
    
    return config

def main():
    """Main execution function"""
    try:
        # Load configuration
        config = load_config()
        
        # Create scraper instance
        scraper = WebsiteScraper(config)
        
        # Start scraping
        results = scraper.scrape_all_sites()
        
        logger.info(f"Scraping completed. Processed {len(results)} sites.")
        
    except KeyboardInterrupt:
        logger.info("\n🛑 Scraping interrupted by user")
    except Exception as e:
        logger.error(f"❌ Main execution failed: {e}")
        sys.exit(1)
    finally:
        if 'scraper' in locals():
            scraper.cleanup()

if __name__ == "__main__":
    main()
