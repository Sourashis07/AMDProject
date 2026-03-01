from typing import Dict, Any, List
from app.agents.base_agent import BaseAgent
from app.services.ollama_service import ollama_service
import json

class ActionAgent(BaseAgent):
    def __init__(self):
        super().__init__("action")
        self.ollama_service = ollama_service
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        query = input_data.get("query", "")
        reasoning_output = input_data.get("reasoning_output", "")
        
        system_prompt = """You are an AI decision-making assistant. 
Based on the query and reasoning, provide:
1. Decision type (informational, actionable, escalation)
2. Confidence score (0-100)
3. Suggested actions (list)
4. Reasoning summary

Respond in JSON format."""
        
        prompt = f"""Query: {query}

Reasoning: {reasoning_output}

Provide a structured decision output in JSON format with keys: decision_type, confidence_score, suggested_actions, reasoning_summary"""
        
        response = await self.ollama_service.generate(
            prompt=prompt,
            system=system_prompt,
            temperature=0.3
        )
        
        # Try to parse JSON response
        try:
            decision = json.loads(response)
        except:
            decision = {
                "decision_type": "informational",
                "confidence_score": 50,
                "suggested_actions": ["Review the response"],
                "reasoning_summary": response
            }
        
        return decision

action_agent = ActionAgent()
