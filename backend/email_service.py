"""
Serviço de envio de emails usando SendGrid
"""
import os
import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.api_key = os.getenv('SENDGRID_API_KEY')
        self.sender_email = os.getenv('SENDER_EMAIL', 'noreply@meulookia.com')
        
        if not self.api_key:
            logger.warning("SENDGRID_API_KEY not configured. Email sending will fail.")
    
    def send_password_reset_code(self, to_email: str, code: str) -> bool:
        """
        Envia email com código de recuperação de senha
        
        Args:
            to_email: Email do destinatário
            code: Código de 6 dígitos
            
        Returns:
            bool: True se enviado com sucesso, False caso contrário
        """
        subject = "Meu Look IA - Código de Recuperação de Senha"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .code-box {{
                    background: white;
                    border: 2px dashed #6c5ce7;
                    padding: 20px;
                    text-align: center;
                    margin: 20px 0;
                    border-radius: 8px;
                }}
                .code {{
                    font-size: 32px;
                    font-weight: bold;
                    color: #6c5ce7;
                    letter-spacing: 8px;
                    font-family: 'Courier New', monospace;
                }}
                .warning {{
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    color: #999;
                    font-size: 12px;
                    margin-top: 30px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔐 Recuperação de Senha</h1>
                <p>Meu Look IA</p>
            </div>
            <div class="content">
                <p>Olá!</p>
                <p>Você solicitou a recuperação de senha da sua conta no <strong>Meu Look IA</strong>.</p>
                
                <div class="code-box">
                    <p style="margin: 0; font-size: 14px; color: #666;">Seu código de verificação é:</p>
                    <div class="code">{code}</div>
                </div>
                
                <p>Digite este código no aplicativo para redefinir sua senha.</p>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul>
                        <li>Este código expira em <strong>30 minutos</strong></li>
                        <li>Use apenas este código se você solicitou a recuperação</li>
                        <li>Nunca compartilhe este código com ninguém</li>
                    </ul>
                </div>
                
                <p>Se você não solicitou esta recuperação, ignore este email e sua senha permanecerá inalterada.</p>
                
                <p>Atenciosamente,<br><strong>Equipe Meu Look IA</strong></p>
            </div>
            <div class="footer">
                <p>Este é um email automático, por favor não responda.</p>
                <p>&copy; 2025 Meu Look IA. Todos os direitos reservados.</p>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(to_email, subject, html_content)
    
    def _send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """
        Método privado para enviar email via SendGrid
        """
        if not self.api_key:
            logger.error("Cannot send email: SENDGRID_API_KEY not configured")
            return False
        
        try:
            message = Mail(
                from_email=self.sender_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            
            sg = SendGridAPIClient(self.api_key)
            response = sg.send(message)
            
            if response.status_code == 202:
                logger.info(f"Email sent successfully to {to_email}")
                return True
            else:
                logger.error(f"Email send failed with status code: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {str(e)}")
            return False

# Instância global do serviço
email_service = EmailService()
