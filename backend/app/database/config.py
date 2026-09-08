"""
PostgreSQL 数据库配置模块
"""

import os
import ssl
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# 从环境变量读取数据库 URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123456@localhost:5432/ai_interview")


def get_postgres_config() -> dict:
    """
    解析 PostgreSQL 连接配置

    Returns:
        dict: 包含 host, port, user, password, database 的配置
    """
    # 移除 asyncpg 驱动标识
    url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    parsed = urlparse(url)

    host = parsed.hostname or "localhost"
    config = {
        "host": host,
        "port": parsed.port or 5432,
        "user": parsed.username or "postgres",
        "password": parsed.password or "",
        "database": parsed.path.lstrip("/") or "ai_interview",
    }

    # 外部云数据库（Supabase/Neon/Render 等）需要 SSL
    if host not in ("localhost", "127.0.0.1", "db", "postgres"):
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        config["ssl"] = ctx
        logger.info("数据库连接启用 SSL（外部主机）")

    return config


def get_postgres_dsn() -> str:
    """
    获取 PostgreSQL DSN (用于 LangGraph)
    
    Returns:
        str: PostgreSQL 连接字符串
    """
    config = get_postgres_config()
    return f"postgresql://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"


# PostgreSQL 配置
POSTGRES_CONFIG = get_postgres_config()
POSTGRES_DSN = get_postgres_dsn()

# 向后兼容 (一些旧代码可能还在引用)
DB_PATH = POSTGRES_DSN
DB_NAME = POSTGRES_CONFIG["database"]

logger.info(f"数据库: PostgreSQL @ {POSTGRES_CONFIG['host']}:{POSTGRES_CONFIG['port']}/{POSTGRES_CONFIG['database']}")
