import os
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
from dotenv import load_dotenv
import supabase._sync.client

load_dotenv()

SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY: str = os.environ["SUPABASE_ANON_KEY"]
SUPABASE_SERVICE_ROLE_KEY: str = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Monkeypatch the out-dated key validation regex in supabase-py 2.4.3
# to return a real Match object instead of a boolean, preventing downstream crashes.
import re
_orig_match = re.match
def _sb_safe_match(pattern, string, *args, **kwargs):
    if string and (string.startswith("sb_") or "ey" in string):
        return _orig_match(".*", string)
    return _orig_match(pattern, string, *args, **kwargs)
supabase._sync.client.re.match = _sb_safe_match

# Public client — respects Row Level Security
# Used for auth sign-in / sign-up operations
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Admin client — bypasses Row Level Security
# Used for all server-side data operations
supabase_admin: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    options=ClientOptions(
        auto_refresh_token=False,
        persist_session=False,
    )
)
