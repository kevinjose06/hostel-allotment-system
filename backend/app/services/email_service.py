import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

STATUS_SUBJECTS = {
    "Approved": "Your hostel application has been approved!",
    "Rejected": "Update on your hostel application",
    "Returned": "Your hostel application needs clarification",
}


async def send_application_status_email(
    to_email: str,
    student_name: str,
    status: str,
    remarks: Optional[str] = None
) -> None:
    """
    Sends an application status notification email to the student.
    Silently fails if SMTP is not configured — Supabase Auth handles
    the critical auth emails (confirm signup, reset password) automatically.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    email_from = os.getenv("EMAIL_FROM", "noreply@rgit.ac.in")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    if not smtp_host or not smtp_user or not smtp_pass:
        # SMTP not configured — skip silently
        return

    subject = STATUS_SUBJECTS.get(status, "Hostel Application Update")

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto;">
      <div style="background: #0D2B6B; padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">RGIT Kottayam — Hostel Portal</h2>
      </div>
      <div style="padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear <strong>{student_name}</strong>,</p>
        <p>Your hostel application status has been updated to:
           <strong style="color: {'#059669' if status == 'Approved' else '#DC2626' if status == 'Rejected' else '#D97706'}">
             {status}
           </strong>
        </p>
        {'<p><strong>Advisor Remarks:</strong><br>' + remarks + '</p>' if remarks else ''}
        <p>
          <a href="{frontend_url}/student/status"
             style="background:#0D2B6B;color:white;padding:10px 20px;
                    border-radius:4px;text-decoration:none;display:inline-block;">
            View Application Status
          </a>
        </p>
        <p style="color:#6B7280; font-size:12px; margin-top:32px;">
          Rajiv Gandhi Institute of Technology, Kottayam — Hostel Allotment System
        </p>
      </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = email_from
    msg["To"]      = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(smtp_host, int(os.getenv("SMTP_PORT", 587))) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(email_from, to_email, msg.as_string())
    except Exception as e:
        # Log but never crash the request over an email failure
        print(f"[EMAIL] Failed to send status email to {to_email}: {e}")
