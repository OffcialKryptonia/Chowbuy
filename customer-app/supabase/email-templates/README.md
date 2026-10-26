# Auth email templates

Paste into Supabase, Authentication, Email Templates. Subjects: "Confirm your ChowBuy email" and "Reset your ChowBuy password".

- `confirm-signup.html` goes in **Confirm signup**
- `reset-password.html` goes in **Reset password**

They use `{{ .ConfirmationURL }}` and the logo at `https://chowbuy.ng/assets/logo.png`. The sender name and address (ChowBuy, no-reply@chowbuy.ng) are set in Authentication, SMTP Settings.
