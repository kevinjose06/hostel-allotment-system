import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

STATUS_SUBJECTS = {
    "Approved": "Your hostel application has been approved!",
    "Rejected": "Update on your hostel application",
    "Returned": "Your hostel application needs clarification",
    "Reset": "Access Recovery: Set a new password for RIT Hostel Portal",
}

async def send_smtp_email(to_email: str, subject: str, html_content: str) -> None:
    """
    Core helper to dispatch an email via standard SMTP.
    Uses Port 465 (SSL) by default for improved security and cloud compatibility.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port_raw = os.getenv("SMTP_PORT", "465")
    smtp_port = int(smtp_port_raw) if smtp_port_raw.isdigit() else 465
    smtp_user = os.getenv("SMTP_USER")
    # App Password (no spaces)
    smtp_pass = os.getenv("SMTP_PASS")
    email_from = os.getenv("EMAIL_FROM", "RIT Hostel Portal <noreply@rit.ac.in>")
    
    if not smtp_host or not smtp_user or not smtp_pass:
        print(f"⚠️ [SMTP] Credentials missing in environment (.env). Reset link for {to_email} skipped.")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = email_from
    msg["To"]      = to_email
    msg.attach(MIMEText(html_content, "html"))

    try:
        # Use SMTP_SSL for direct connection on Port 465, or standard SMTP for others
        if smtp_port == 465:
            # Direct SSL Connection (Preferred for production cloud environments)
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15.0) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(email_from, [to_email], msg.as_string())
        else:
            # Standard STARTTLS Connection (e.g. Port 587)
            with smtplib.SMTP(smtp_host, smtp_port, timeout=15.0) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(email_from, [to_email], msg.as_string())
                
        print(f"✅ [SMTP SUCCESS] Institutional email delivered to {to_email}")
    except Exception as e:
        print(f"❌ [SMTP ERROR] Failed to dispatch via {smtp_host}")
        print(f"   Reason: {str(e)}")


async def send_application_status_email(
    to_email: str,
    student_name: str,
    status: str,
    remarks: Optional[str] = None
) -> None:
    """
    Sends an application status notification email using standard SMTP.
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    subject = STATUS_SUBJECTS.get(status, "Hostel Application Update")

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; color: #1f2937;">
      <div style="background: #0D2B6B; padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">RIT Kottayam — Hostel Portal</h2>
      </div>
      <div style="padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px; background: white;">
        <p>Dear <strong>{student_name}</strong>,</p>
        <p>Your hostel application status has been updated to:
           <strong style="color: {'#059669' if status == 'Approved' else '#DC2626' if status == 'Rejected' else '#D97706'}">
             {status}
           </strong>
        </p>
        {'<p><strong>Advisor Remarks:</strong><br>' + remarks + '</p>' if remarks else ''}
        <p style="margin-top: 32px;">
          <a href="{frontend_url}/student/status"
             style="background:#0D2B6B;color:white;padding:12px 24px;
                    border-radius:6px;text-decoration:none;display:inline-block;font-weight: bold;">
            View Application Status
          </a>
        </p>
        <p style="color:#6B7280; font-size:12px; margin-top:40px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
          Rajiv Gandhi Institute of Technology, Kottayam — Hostel Allotment System
        </p>
      </div>
    </div>
    """
    await send_smtp_email(to_email, subject, html_body)


async def send_password_reset_email(to_email: str, reset_link: str) -> None:
    """
    Sends a professionally branded recovery email via standard SMTP.
    """
    subject = STATUS_SUBJECTS["Reset"]

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; color: #1e293b;">
      <div style="background: #0D2B6B; padding: 32px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="color: white; margin: 0; font-size: 24px;">RIT Hostel Portal</h2>
        <p style="color: #cbd5e1; margin-top: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Access Recovery</p>
      </div>
      <div style="padding: 40px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 8px 8px; background: #ffffff;">
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">Hello,</p>
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">
          A password reset request was initiated for your institutional account on the <strong>Rajiv Gandhi Institute of Technology (RIT)</strong> Hostel Portal.
        </p>
        <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 32px;">
          To securely reset your credentials and regain access to your dashboard, please click the button below:
        </p>
        <div style="text-align: center; margin: 40px 0;">
          <a href="{reset_link}" 
             style="background: #0D2B6B; color: white; padding: 14px 28px; 
                    border-radius: 6px; text-decoration: none; display: inline-block;
                    font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
          If you did not request this change, you can safely ignore this email. This link is secure and will expire in 1 hour.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; text-align: center;">
          Rajiv Gandhi Institute of Technology, Kottayam — Hostel Allotment System
        </p>
      </div>
    </div>
    """
    await send_smtp_email(to_email, subject, html_body)
