import { Page, Locator } from '@playwright/test';

export class SignupPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly roleSelect: Locator;
  readonly submitButton: Locator;
  readonly clientErrorMessage: Locator;
  readonly serverErrorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByTestId('register-username-input');
    this.emailInput = page.getByTestId('register-email-input');
    this.passwordInput = page.getByTestId('register-password-input');
    this.confirmPasswordInput = page.getByTestId('register-confirm-password-input');
    this.roleSelect = page.getByTestId('register-role-select');
    this.submitButton = page.getByTestId('register-submit-button');
    this.clientErrorMessage = page.getByTestId('register-error-message');
    this.serverErrorMessage = page.getByTestId('register-server-error');
  }

  async goto() {
    await this.page.goto('/register');
  }

  async fillForm(data: { username?: string; email?: string; password?: string; confirmPassword?: string; role?: string }) {
    if (data.username) await this.usernameInput.fill(data.username);
    if (data.email) await this.emailInput.fill(data.email);
    if (data.password) await this.passwordInput.fill(data.password);
    if (data.confirmPassword) await this.confirmPasswordInput.fill(data.confirmPassword);
    if (data.role) await this.roleSelect.selectOption(data.role);
  }

  async submit() {
    await this.submitButton.click();
  }

  async getClientErrorMessage() {
    await this.clientErrorMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await this.clientErrorMessage.isVisible()) {
      return this.clientErrorMessage.textContent();
    }
    return null;
  }

  async getServerErrorMessage() {
    await this.serverErrorMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await this.serverErrorMessage.isVisible()) {
      return this.serverErrorMessage.textContent();
    }
    return null;
  }
}
