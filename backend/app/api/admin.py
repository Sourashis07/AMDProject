from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.database_models import User
from app.middleware.auth import get_current_user, security
from fastapi.security import HTTPAuthorizationCredentials
import psutil
import GPUtil

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/system-stats")
async def get_system_stats(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get system resource usage (Admin only)"""
    token_data = await get_current_user(None, credentials)
    user = db.query(User).filter(User.firebase_uid == token_data["uid"]).first()
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # CPU Usage
    cpu_percent = psutil.cpu_percent(interval=1, percpu=True)
    cpu_count = psutil.cpu_count()
    cpu_freq = psutil.cpu_freq()
    
    # Get CPU name
    import platform
    cpu_name = platform.processor()
    if not cpu_name:
        try:
            import subprocess
            cpu_name = subprocess.check_output("wmic cpu get name", shell=True).decode().split('\n')[1].strip()
        except:
            cpu_name = "Unknown CPU"
    
    # Memory Usage
    memory = psutil.virtual_memory()
    
    # GPU Usage (if available)
    gpu_stats = []
    try:
        gpus = GPUtil.getGPUs()
        for gpu in gpus:
            gpu_stats.append({
                "id": gpu.id,
                "name": gpu.name,
                "load": f"{gpu.load * 100:.1f}%",
                "memory_used": f"{gpu.memoryUsed}MB",
                "memory_total": f"{gpu.memoryTotal}MB",
                "memory_percent": f"{(gpu.memoryUsed / gpu.memoryTotal) * 100:.1f}%",
                "temperature": f"{gpu.temperature}°C"
            })
    except:
        gpu_stats = [{"message": "No GPU detected or GPUtil not available"}]
    
    # Active users count
    active_users = db.query(User).filter(User.organization_id == user.organization_id).count()
    
    return {
        "cpu": {
            "name": cpu_name,
            "cores": cpu_count,
            "usage_per_core": [f"{usage:.1f}%" for usage in cpu_percent],
            "average_usage": f"{sum(cpu_percent) / len(cpu_percent):.1f}%",
            "frequency": f"{cpu_freq.current:.0f}MHz" if cpu_freq else "N/A"
        },
        "memory": {
            "total": f"{memory.total / (1024**3):.2f}GB",
            "used": f"{memory.used / (1024**3):.2f}GB",
            "available": f"{memory.available / (1024**3):.2f}GB",
            "percent": f"{memory.percent}%"
        },
        "gpu": gpu_stats,
        "active_users": active_users
    }

@router.get("/active-sessions")
async def get_active_sessions(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get active user sessions (Admin only)"""
    from fastapi import Request
    token_data = await get_current_user(None, credentials)
    user = db.query(User).filter(User.firebase_uid == token_data["uid"]).first()
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from app.models.database_models import QueryHistory
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    # Get recent activity (last 24 hours)
    recent_time = datetime.utcnow() - timedelta(hours=24)
    
    active_users = db.query(
        User.email,
        User.last_ip,
        func.count(QueryHistory.id).label('query_count'),
        func.max(QueryHistory.created_at).label('last_activity')
    ).join(
        QueryHistory, User.id == QueryHistory.user_id
    ).filter(
        QueryHistory.created_at >= recent_time
    ).group_by(User.email, User.last_ip).all()
    
    return {
        "active_sessions": [
            {
                "email": u.email,
                "ip": u.last_ip or "Unknown",
                "queries_24h": u.query_count,
                "last_activity": u.last_activity.isoformat() if u.last_activity else None
            }
            for u in active_users
        ]
    }
