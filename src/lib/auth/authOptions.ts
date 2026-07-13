import { users } from "./../db/schema";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "../db/db";
import { AuthOptions } from "next-auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      async profile(profile, tokens: any) {
        console.log("profile", profile);
        console.log("tokens", tokens);

        const data = {
          fname: profile.given_name,
          lname: profile.family_name,
          email: profile.email,
          provider: "GOOGLE",
          externalId: profile.sub,
          image: profile.picture,
        };

        try {
          const user = await db
            .insert(users)
            .values(data)
            .onConflictDoUpdate({ target: users.email, set: data })
            .returning();

          return {
            ...data,
            name: data.fname,
            id: String(user[0].id),
            role: user[0].role,
          };
        } catch (error) {
          console.log("error", error);
          return {
            id: "",
          };
        }
      },
    }),

    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        // Find user by email
        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        const user = result[0];

        if (!user) {
          throw new Error("No account found with this email.");
        }

        if (!user.password) {
          throw new Error("This account uses Google login. Please sign in with Google.");
        }

        // Compare submitted password with stored hash
        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Incorrect password. Please try again.");
        }

        return {
          id: String(user.id),
          name: `${user.fname} ${user.lname}`,
          email: user.email,
          image: user.image ?? undefined,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    session(data: any) {
      return data;
    },
    jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
  },

  pages: {
    signIn: "/login", // Optional: customize the sign-in page path if you have one
  },
};
