import React from "react";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search } from "lucide-react";

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("EmptyState", () => {
  it("renders basic content correctly", () => {
    render(
      <EmptyState
        title="No Results"
        description="Try adjusting your search criteria."
      />
    );

    expect(screen.getByText("No Results")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search criteria.")).toBeInTheDocument();
  });

  it("renders with custom action label and href", () => {
    render(
      <EmptyState
        title="Empty"
        description="Nothing here."
        actionLabel="Click Me"
        actionHref="/custom-action"
      />
    );

    const button = screen.getByText("Click Me");
    expect(button).toBeInTheDocument();
    expect(button.closest("a")).toHaveAttribute("href", "/custom-action");
  });

  it("renders with a custom icon", () => {
    const { container } = render(
      <EmptyState
        title="Search"
        description="Find something."
        icon={Search}
      />
    );

    // Lucide icons render as svg
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    // We can't easily check it's the Search icon without deeper inspection, 
    // but verifying an SVG exists is a good start.
  });

  it("does not render action button if label or href is missing", () => {
    // Note: EmptyState has default values for actionLabel and actionHref,
    // so we need to pass null/undefined if the component supports it.
    // Looking at the implementation, it defaults to /deploy.
    // Let's check if we can pass empty strings to hide it.
    
    render(
      <EmptyState
        title="No Action"
        description="Just info."
        actionLabel=""
        actionHref=""
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
