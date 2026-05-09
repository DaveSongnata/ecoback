import { BaseMail } from '@adonisjs/mail'

export default class PasswordResetNotification extends BaseMail {
  constructor(
    private to: string,
    private newPassword: string
  ) {
    super()
  }

  prepare() {
    this.message
      .to(this.to)
      .subject('Sua nova senha')
      .text(
        [
          `Olá,`,
          ``,
          `Recebemos um pedido de redefinição de senha.`,
          `Sua nova senha temporária é:`,
          ``,
          `    ${this.newPassword}`,
          ``,
          `Recomendamos trocá-la pela rota de atualização de perfil após o login.`,
        ].join('\n')
      )
  }
}
