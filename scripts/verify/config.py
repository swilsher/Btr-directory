import os
import sys
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


@dataclass
class Config:
    supabase_url: str
    supabase_service_key: str
    anthropic_api_key: str
    output_dir: Path
    crawl_delay_seconds: float = 2.5
    max_pages_per_listing: int = 3
    test_limit: int = 20
    llm_model: str = "claude-sonnet-4-20250514"


def load_config() -> Config:
    """Load configuration from scripts/.env file."""
    scripts_dir = Path(__file__).resolve().parent.parent
    env_path = scripts_dir / ".env"

    if env_path.exists():
        load_dotenv(env_path, override=True)
    else:
        print(f"Warning: No .env file found at {env_path}")

    output_dir = scripts_dir / "output"
    output_dir.mkdir(exist_ok=True)

    return Config(
        supabase_url=os.getenv("SUPABASE_URL", ""),
        supabase_service_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", ""),
        output_dir=output_dir,
        crawl_delay_seconds=float(os.getenv("CRAWL_DELAY_SECONDS", "2.5")),
        max_pages_per_listing=int(os.getenv("MAX_CRAWL_PAGES_PER_LISTING", "3")),
        test_limit=int(os.getenv("TEST_LIMIT", "20")),
    )


def validate_config(config: Config, use_llm: bool = True) -> None:
    """Validate required configuration. Exits with actionable error if invalid."""
    errors = []

    if not config.supabase_url:
        errors.append(
            "SUPABASE_URL is required.\n"
            "  Add to scripts/.env: SUPABASE_URL=https://your-project.supabase.co"
        )

    if not config.supabase_service_key:
        errors.append(
            "SUPABASE_SERVICE_ROLE_KEY is required (anon key cannot read unpublished listings).\n"
            "  Get it from: Supabase Dashboard > Settings > API > service_role key\n"
            "  Add to scripts/.env: SUPABASE_SERVICE_ROLE_KEY=your_key_here"
        )

    if use_llm and not config.anthropic_api_key:
        errors.append(
            "ANTHROPIC_API_KEY is required for LLM analysis.\n"
            "  Get it from: https://console.anthropic.com/settings/keys\n"
            "  Add to scripts/.env: ANTHROPIC_API_KEY=your_key_here\n"
            "  Or run with --no-llm to skip LLM analysis."
        )

    if errors:
        print("\n=== Configuration Errors ===\n")
        for err in errors:
            print(f"  ERROR: {err}\n")
        sys.exit(1)
