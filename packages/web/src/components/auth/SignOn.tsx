import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

export default function SignOn() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
      }}
    >
      <Card style={{ width: 420 }}>
        <CardHeader>
          <CardTitle>OT Continuum</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Auth wiring comes later
            }}
          >
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@company.com" />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" />
              </div>

              <Button type="submit" style={{ marginTop: 8 }}>
                Sign in
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

