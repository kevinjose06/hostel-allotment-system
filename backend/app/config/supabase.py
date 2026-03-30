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
# so it can accept the new non-JWT sb_publishable and sb_secret keys.
supabase._sync.client.re.match = lambda *args, **kwargs: True

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
