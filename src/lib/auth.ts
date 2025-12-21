import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "staff-credentials",
      name: "Staff Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        if (!user.isActive) {
          throw new Error("Account is deactivated");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          userType: "staff",
        };
      },
    }),
    CredentialsProvider({
      id: "client-credentials",
      name: "Client Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const clientAccess = await prisma.clientPortalAccess.findUnique({
          where: { email: credentials.email },
          include: {
            client: true,
          },
        });

        if (!clientAccess || !clientAccess.password) {
          throw new Error("Invalid email or password");
        }

        if (!clientAccess.isActive) {
          throw new Error("Portal access is deactivated");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          clientAccess.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Update last access
        await prisma.clientPortalAccess.update({
          where: { id: clientAccess.id },
          data: { lastAccessAt: new Date() },
        });

        return {
          id: clientAccess.id,
          email: clientAccess.email,
          name: clientAccess.client.preferredName || clientAccess.client.legalName,
          role: "ASSOCIATE" as any, // Client portal users don't have a UserRole, using ASSOCIATE as placeholder
          userType: "client",
          clientId: clientAccess.clientId,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.userType = (user as any).userType;
        token.clientId = (user as any).clientId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).userType = token.userType;
        (session.user as any).clientId = token.clientId;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow explicit redirects
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // For relative URLs, prepend baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Default to baseUrl for external URLs
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Helper function to verify passwords
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
