import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import date
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _send(subject: str, body_html: str, to: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg.attach(MIMEText(body_html, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to, msg.as_string())
        logger.info(f"Email sent: {subject} -> {to}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")


def send_alert_notification(
    alert_message: str,
    inspection_id: str,
    line_name: str,
    to: str | None = None,
) -> None:
    recipient = to or settings.ALERT_EMAIL_TO
    subject = f"[INSPECTION ALERT] {line_name}"
    body = f"""
    <h2>Inspection Alert</h2>
    <p><strong>Line:</strong> {line_name}</p>
    <p><strong>Issue:</strong> {alert_message}</p>
    <p><strong>Inspection ID:</strong> {inspection_id}</p>
    <p>Please log in to review and acknowledge this alert.</p>
    """
    _send(subject, body, recipient)


def send_daily_summary(
    summary_date: date,
    total: int,
    flagged: int,
    unacknowledged: int,
    lines_with_issues: list[str],
) -> None:
    subject = f"[Daily Summary] Inspection Report — {summary_date}"
    issues_html = (
        "<ul>" + "".join(f"<li>{l}</li>" for l in lines_with_issues) + "</ul>"
        if lines_with_issues else "<p>No issues recorded.</p>"
    )
    body = f"""
    <h2>Daily Inspection Summary — {summary_date}</h2>
    <table>
      <tr><td>Total inspections submitted:</td><td><strong>{total}</strong></td></tr>
      <tr><td>Inspections with flags:</td><td><strong>{flagged}</strong></td></tr>
      <tr><td>Unacknowledged alerts:</td><td><strong>{unacknowledged}</strong></td></tr>
    </table>
    <h3>Lines with issues:</h3>
    {issues_html}
    """
    _send(subject, body, settings.ALERT_EMAIL_TO)

# Location: backend/app/services/email_service.py