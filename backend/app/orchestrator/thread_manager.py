from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Callable, Any, Dict
import multiprocessing
from app.config.settings import get_settings
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)

class ThreadManager:
    def __init__(self):
        # Detect CPU cores
        cpu_count = multiprocessing.cpu_count()
        self.max_workers = min(settings.MAX_WORKERS, cpu_count)
        logger.info(f"ThreadManager initialized with {self.max_workers} workers (CPU cores: {cpu_count})")
    
    def process_parallel(
        self,
        func: Callable,
        items: List[Any],
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Process items in parallel using thread pool"""
        results = []
        
        if not settings.ENABLE_THREADING or len(items) == 1:
            # Sequential processing
            for item in items:
                try:
                    result = func(item, **kwargs)
                    results.append({"success": True, "data": result, "item": item})
                except Exception as e:
                    logger.error(f"Error processing item: {e}")
                    results.append({"success": False, "error": str(e), "item": item})
            return results
        
        # Parallel processing
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_item = {
                executor.submit(func, item, **kwargs): item
                for item in items
            }
            
            for future in as_completed(future_to_item):
                item = future_to_item[future]
                try:
                    result = future.result()
                    results.append({"success": True, "data": result, "item": item})
                except Exception as e:
                    logger.error(f"Error processing item {item}: {e}")
                    results.append({"success": False, "error": str(e), "item": item})
        
        return results

thread_manager = ThreadManager()
