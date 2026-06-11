export class User {
  constructor() {}

  isAuthenticated: boolean = false;
  email: string = "";

  getDisplayName(): string {
    switch (this.email) {
      case "morganfreyss@gmail.com":
        return "Morgan"

      case "lebourg-fanny@hotmail.fr":
        return "Fanny"

      default:
        return "Anonyme";
    }
  }
}
