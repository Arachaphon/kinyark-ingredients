/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CreateRecipePage from "@/app/(main)/create-recipe/page";

// Mock leaflet as it requires a real DOM
jest.mock("leaflet", () => ({
  map: jest.fn(),
  marker: jest.fn(),
  tileLayer: jest.fn(),
  Icon: { Default: { prototype: {}, mergeOptions: jest.fn() } },
}));

// Mock Navbar and Link
jest.mock("@/components/Navbar", () => {
  const MockNavbar = () => <div data-testid="navbar" />;
  MockNavbar.displayName = "MockNavbar";
  return MockNavbar;
});
jest.mock("next/link", () => {
  const MockLink = ({ children }: { children: React.ReactNode }) => <a>{children}</a>;
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("CreateRecipePage UI Authorization", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("USER cannot access Store Recipe toggle", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ user: { role: "USER" } }),
    });

    render(<CreateRecipePage />);

    // Wait for the fetch to resolve and state to update
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/me");
    });

    // The store toggle button should not be rendered
    expect(screen.queryByText("ร้านค้า")).not.toBeInTheDocument();
  });

  test("STORE can access Store Recipe toggle", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ user: { role: "STORE" } }),
    });

    render(<CreateRecipePage />);

    await waitFor(() => {
      expect(screen.getByText("ร้านค้า")).toBeInTheDocument();
    });
  });

  test("ADMIN can access Store Recipe toggle", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ user: { role: "ADMIN" } }),
    });

    render(<CreateRecipePage />);

    await waitFor(() => {
      expect(screen.getByText("ร้านค้า")).toBeInTheDocument();
    });
  });
});
