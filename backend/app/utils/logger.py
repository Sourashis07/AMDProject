import logging
import os
from datetime import datetime
from app.config.settings import get_settings

settings = get_settings()

# Create logs directory if it doesn't exist
log_dir = os.path.dirname(settings.LOG_FILE)
if log_dir and not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(settings.LOG_FILE),
        logging.StreamHandler()
    ]
)

def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)

class PerformanceLogger:
    def __init__(self, logger: logging.Logger):
        self.logger = logger
        self.start_time = None
    
    def start(self, operation: str):
        self.start_time = datetime.now()
        self.logger.info(f"Starting: {operation}")
    
    def end(self, operation: str):
        if self.start_time:
            duration = (datetime.now() - self.start_time).total_seconds()
            self.logger.info(f"Completed: {operation} in {duration:.2f}s")
            return duration
        return 0
