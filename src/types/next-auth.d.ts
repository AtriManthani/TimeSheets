import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      email?: string | null;
      profileComplete: boolean;
    };
  }
  interface User {
    id: string;
    username: string;
    email?: string | null;
    profileComplete: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    profileComplete: boolean;
  }
}
