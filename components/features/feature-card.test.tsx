/**
 * FeatureCard Component Tests
 *
 * Test suite for the FeatureCard component covering:
 * - Rendering all variants
 * - Accessibility features
 * - User interactions
 * - Theme support
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FeatureCard, FeatureCardGrid } from "./feature-card";
import type { Feature } from "@/lib/features/types";

// Mock Framer Motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Test fixture
const mockFeature: Feature = {
  id: "test-feature",
  title: "Test Feature",
  description: "This is a test feature description",
  status: "production",
  complexity: "intermediate",
  icon: "shield-check",
  location: "lib/test/feature.ts",
  techSpecs: {
    protocol: "WebRTC",
    maxFileSize: "Unlimited",
  } as any,
  codeExamples: [
    {
      language: "typescript",
      code: "const test = true;",
      description: "Example code",
    },
  ],
  tags: ["test", "example"],
  relatedFeatures: ["feature-1", "feature-2"],
  documentation: "https://docs.example.com",
};

describe("FeatureCard", () => {
  describe("Compact Variant", () => {
    it("renders feature title and description", () => {
      render(<FeatureCard feature={mockFeature} variant="compact" />);

      expect(screen.getByText("Test Feature")).toBeTruthy();
      expect(
        screen.getByText("This is a test feature description")
      ).toBeTruthy();
    });

    it("renders status badge when showStatus is true", () => {
      render(<FeatureCard feature={mockFeature} variant="compact" showStatus />);

      expect(screen.getByText("production")).toBeTruthy();
      expect(screen.getByLabelText("Status: production")).toBeTruthy();
    });

    it("does not render status badge when showStatus is false", () => {
      render(
        <FeatureCard feature={mockFeature} variant="compact" showStatus={false} />
      );

      expect(screen.queryByText("production")).not.toBeTruthy();
    });

    it("calls onClick when card is clicked", () => {
      const handleClick = vi.fn();
      render(
        <FeatureCard
          feature={mockFeature}
          variant="compact"
          onClick={handleClick}
        />
      );

      const card = screen.getByRole("article");
      fireEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("handles keyboard navigation (Enter key)", () => {
      const handleClick = vi.fn();
      render(
        <FeatureCard
          feature={mockFeature}
          variant="compact"
          onClick={handleClick}
        />
      );

      const card = screen.getByRole("article");
      fireEvent.keyDown(card, { key: "Enter" });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("handles keyboard navigation (Space key)", () => {
      const handleClick = vi.fn();
      render(
        <FeatureCard
          feature={mockFeature}
          variant="compact"
          onClick={handleClick}
        />
      );

      const card = screen.getByRole("article");
      fireEvent.keyDown(card, { key: " " });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("has proper ARIA label", () => {
      render(<FeatureCard feature={mockFeature} variant="compact" />);

      expect(
        screen.getByLabelText("Feature: Test Feature")
      ).toBeTruthy();
    });

    it("is focusable with tabIndex", () => {
      render(<FeatureCard feature={mockFeature} variant="compact" />);

      const card = screen.getByRole("article");
      expect(card).toHaveProperty("tabIndex", "0");
    });
  });

  describe("Detailed Variant", () => {
    it("renders all feature information", () => {
      render(
        <FeatureCard
          feature={mockFeature}
          variant="detailed"
          showStatus
          showTechSpecs
          showCodeExample
        />
      );

      expect(screen.getByText("Test Feature")).toBeTruthy();
      expect(
        screen.getByText("This is a test feature description")
      ).toBeTruthy();
      expect(screen.getByText("production")).toBeTruthy();
    });

    it("renders technical specifications when showTechSpecs is true", () => {
      render(
        <FeatureCard
          feature={mockFeature}
          variant="detailed"
          showTechSpecs
        />
      );

      expect(screen.getByText("Technical Specifications")).toBeTruthy();
      expect(screen.getByText(/protocol/i)).toBeTruthy();
      expect(screen.getByText("WebRTC")).toBeTruthy();
    });

    it("does not render tech specs when showTechSpecs is false", () => {
      render(
        <FeatureCard
          feature={mockFeature}
          variant="detailed"
          showTechSpecs={false}
        />
      );

      expect(
        screen.queryByText("Technical Specifications")
      ).not.toBeTruthy();
    });

    it("renders code example when showCodeExample is true", () => {
      render(
        <FeatureCard
          feature={mockFeature}
          variant="detailed"
          showCodeExample
        />
      );

      expect(screen.getByText("Code Example")).toBeTruthy();
      expect(screen.getByText("const test = true;")).toBeTruthy();
      expect(screen.getByText("typescript")).toBeTruthy();
    });

    it("renders complexity badge", () => {
      render(<FeatureCard feature={mockFeature} variant="detailed" />);

      expect(screen.getByText("intermediate")).toBeTruthy();
    });

    it("renders tags", () => {
      render(<FeatureCard feature={mockFeature} variant="detailed" />);

      expect(screen.getByText("test")).toBeTruthy();
      expect(screen.getByText("example")).toBeTruthy();
    });

    it("shows related features count", () => {
      render(<FeatureCard feature={mockFeature} variant="detailed" />);

      expect(screen.getByText("2 related features")).toBeTruthy();
    });
  });

  describe("Interactive Variant", () => {
    it("renders action buttons for production features", () => {
      render(
        <FeatureCard
          feature={mockFeature}
          variant="interactive"
        />
      );

      expect(screen.getByLabelText(/try.*demo/i)).toBeTruthy();
      expect(screen.getByLabelText(/view.*documentation/i)).toBeTruthy();
    });

    it("renders file location", () => {
      render(<FeatureCard feature={mockFeature} variant="interactive" />);

      expect(screen.getByText("lib/test/feature.ts")).toBeTruthy();
    });

    it("Try Demo button calls onClick", () => {
      const handleClick = vi.fn();
      render(
        <FeatureCard
          feature={mockFeature}
          variant="interactive"
          onClick={handleClick}
        />
      );

      const demoButton = screen.getByLabelText(/try.*demo/i);
      fireEvent.click(demoButton);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("View Docs button opens documentation link", () => {
      const originalOpen = window.open;
      window.open = vi.fn();

      render(
        <FeatureCard
          feature={mockFeature}
          variant="interactive"
        />
      );

      const docsButton = screen.getByLabelText(/view.*documentation/i);
      fireEvent.click(docsButton);

      expect(window.open).toHaveBeenCalledWith(
        "https://docs.example.com",
        "_blank"
      );

      window.open = originalOpen;
    });

    it("shows Learn More button for features without demo or docs", () => {
      const featureWithoutLinks = {
        ...mockFeature,
        status: "planned" as const,
      };
      // Remove documentation property
      const { documentation: _documentation, ...rest } = featureWithoutLinks;

      render(
        <FeatureCard
          feature={rest as Feature}
          variant="interactive"
        />
      );

      expect(screen.getByLabelText(/learn more/i)).toBeTruthy();
    });
  });

  describe("Status Badge Colors", () => {
    it.each([
      ["production", "production"],
      ["beta", "beta"],
      ["experimental", "experimental"],
      ["planned", "planned"],
    ])("renders %s status with correct styling", (status, expected) => {
      const featureWithStatus: Feature = {
        ...mockFeature,
        status: status as any,
      };

      render(
        <FeatureCard
          feature={featureWithStatus}
          variant="compact"
          showStatus
        />
      );

      expect(screen.getByText(expected)).toBeTruthy();
    });
  });

  describe("Custom Styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <FeatureCard
          feature={mockFeature}
          variant="compact"
          className="custom-class"
        />
      );

      const card = container.querySelector(".custom-class");
      expect(card).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("has proper role attribute", () => {
      render(<FeatureCard feature={mockFeature} variant="compact" />);

      expect(screen.getByRole("article")).toBeTruthy();
    });

    it("tech specs have list role", () => {
      render(
        <FeatureCard
          feature={mockFeature}
          variant="detailed"
          showTechSpecs
        />
      );

      const list = screen.getByLabelText("Technical specifications");
      expect(list).toHaveProperty("role", "list");
    });

    it("does not trigger click on other keys", () => {
      const handleClick = vi.fn();
      render(
        <FeatureCard
          feature={mockFeature}
          variant="compact"
          onClick={handleClick}
        />
      );

      const card = screen.getByRole("article");
      fireEvent.keyDown(card, { key: "a" });

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles feature without icon", () => {
      const { icon: _icon, ...featureWithoutIcon } = mockFeature;

      render(<FeatureCard feature={featureWithoutIcon as Feature} variant="compact" />);

      expect(screen.getByText("Test Feature")).toBeTruthy();
    });

    it("handles feature without tech specs", () => {
      const { techSpecs: _techSpecs, ...featureWithoutSpecs } = mockFeature;

      render(
        <FeatureCard
          feature={featureWithoutSpecs as Feature}
          variant="detailed"
          showTechSpecs
        />
      );

      expect(
        screen.queryByText("Technical Specifications")
      ).not.toBeTruthy();
    });

    it("handles feature without code examples", () => {
      const { codeExamples: _codeExamples, ...featureWithoutCode } = mockFeature;

      render(
        <FeatureCard
          feature={featureWithoutCode as Feature}
          variant="detailed"
          showCodeExample
        />
      );

      expect(screen.queryByText("Code Example")).not.toBeTruthy();
    });

    it("handles feature without tags", () => {
      const { tags: _tags, ...featureWithoutTags } = mockFeature;

      render(<FeatureCard feature={featureWithoutTags as Feature} variant="detailed" />);

      expect(screen.getByText("Test Feature")).toBeTruthy();
    });

    it("handles empty related features array", () => {
      const featureWithoutRelated: Feature = {
        ...mockFeature,
        relatedFeatures: [],
      };

      render(
        <FeatureCard feature={featureWithoutRelated} variant="detailed" />
      );

      expect(screen.queryByText(/related features/i)).not.toBeTruthy();
    });
  });
});

describe("FeatureCardGrid", () => {
  it("renders children in grid layout", () => {
    render(
      <FeatureCardGrid>
        <FeatureCard feature={mockFeature} variant="compact" />
        <FeatureCard feature={mockFeature} variant="compact" />
      </FeatureCardGrid>
    );

    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(2);
  });

  it("has proper list role", () => {
    const { container } = render(
      <FeatureCardGrid>
        <FeatureCard feature={mockFeature} variant="compact" />
      </FeatureCardGrid>
    );

    const grid = container.querySelector('[role="list"]');
    expect(grid).toBeTruthy();
  });

  it("applies custom className", () => {
    const { container } = render(
      <FeatureCardGrid className="custom-grid">
        <FeatureCard feature={mockFeature} variant="compact" />
      </FeatureCardGrid>
    );

    const grid = container.querySelector(".custom-grid");
    expect(grid).toBeTruthy();
  });

  it("uses responsive grid classes", () => {
    const { container } = render(
      <FeatureCardGrid>
        <FeatureCard feature={mockFeature} variant="compact" />
      </FeatureCardGrid>
    );

    const grid = container.querySelector('[role="list"]');
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("sm:grid-cols-2");
    expect(grid?.className).toContain("lg:grid-cols-3");
  });
});

describe("Integration Tests", () => {
  it("renders multiple cards in a grid", () => {
    const features: Feature[] = [
      { ...mockFeature, id: "1", title: "Feature 1" },
      { ...mockFeature, id: "2", title: "Feature 2" },
      { ...mockFeature, id: "3", title: "Feature 3" },
    ];

    render(
      <FeatureCardGrid>
        {features.map((feature) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            variant="compact"
            showStatus
          />
        ))}
      </FeatureCardGrid>
    );

    expect(screen.getByText("Feature 1")).toBeTruthy();
    expect(screen.getByText("Feature 2")).toBeTruthy();
    expect(screen.getByText("Feature 3")).toBeTruthy();
  });

  it("handles click events on multiple cards independently", () => {
    const handleClick1 = vi.fn();
    const handleClick2 = vi.fn();

    render(
      <FeatureCardGrid>
        <FeatureCard
          feature={{ ...mockFeature, id: "1", title: "Card 1" }}
          variant="compact"
          onClick={handleClick1}
        />
        <FeatureCard
          feature={{ ...mockFeature, id: "2", title: "Card 2" }}
          variant="compact"
          onClick={handleClick2}
        />
      </FeatureCardGrid>
    );

    const card1 = screen.getByLabelText("Feature: Card 1");
    const card2 = screen.getByLabelText("Feature: Card 2");

    fireEvent.click(card1);
    expect(handleClick1).toHaveBeenCalledTimes(1);
    expect(handleClick2).not.toHaveBeenCalled();

    fireEvent.click(card2);
    expect(handleClick2).toHaveBeenCalledTimes(1);
    expect(handleClick1).toHaveBeenCalledTimes(1);
  });
});
