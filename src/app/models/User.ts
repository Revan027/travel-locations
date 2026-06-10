export class User {
  constructor() {}

  isAuthenticated: boolean = false;
  email: string = "";

  getDisplayName(): string {
    switch (this.email) {
      case "morganfreyss@gmail.com":
        return "Morgan"

      default:
        return "Anonyme";
    }
  }
}
