from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from datetime import datetime
from app.utils.logger import get_logger, PerformanceLogger
from sqlalchemy.orm import Session
from app.models.database_models import AgentLog

logger = get_logger(__name__)

class BaseAgent(ABC):
    def __init__(self, agent_type: str):
        self.agent_type = agent_type
        self.logger = get_logger(f"agent.{agent_type}")
        self.perf_logger = PerformanceLogger(self.logger)
    
    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        pass
    
    async def run(
        self,
        input_data: Dict[str, Any],
        db: Optional[Session] = None,
        document_id: Optional[int] = None
    ) -> Dict[str, Any]:
        action = input_data.get("action", "execute")
        self.perf_logger.start(f"{self.agent_type}.{action}")
        
        try:
            result = await self.execute(input_data)
            execution_time = int(self.perf_logger.end(f"{self.agent_type}.{action}") * 1000)
            
            if db:
                self._log_to_db(
                    db=db,
                    document_id=document_id,
                    action=action,
                    input_data=input_data,
                    output_data=result,
                    status="success",
                    execution_time=execution_time
                )
            
            return result
        
        except Exception as e:
            self.logger.error(f"Error in {self.agent_type}: {e}")
            execution_time = int(self.perf_logger.end(f"{self.agent_type}.{action}") * 1000)
            
            if db:
                self._log_to_db(
                    db=db,
                    document_id=document_id,
                    action=action,
                    input_data=input_data,
                    output_data=None,
                    status="error",
                    error_message=str(e),
                    execution_time=execution_time
                )
            
            raise
    
    def _log_to_db(
        self,
        db: Session,
        document_id: Optional[int],
        action: str,
        input_data: Dict[str, Any],
        output_data: Optional[Dict[str, Any]],
        status: str,
        error_message: Optional[str] = None,
        execution_time: Optional[int] = None
    ):
        log = AgentLog(
            document_id=document_id,
            agent_type=self.agent_type,
            action=action,
            input_data=input_data,
            output_data=output_data,
            status=status,
            error_message=error_message,
            execution_time=execution_time
        )
        db.add(log)
        db.commit()
