import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepReview } from "@/app/deploy/steps/StepReview";
import { useWallet } from "@/app/hooks/useWallet";
import { useWatch } from "react-hook-form";

// Mock the hooks
jest.mock("@/app/hooks/useWallet");
jest.mock("react-hook-form", () => ({
  useWatch: jest.fn(),
}));

// Mock useNetwork
jest.mock("@/app/providers/NetworkProvider", () => ({
  useNetwork: () => ({
    networkConfig: { horizonUrl: "https://horizon-testnet.stellar.org", network: "testnet" }
  }),
}));

// Mock StellarSdk
jest.mock("@stellar/stellar-sdk", () => ({
  Horizon: {
    Server: jest.fn().mockImplementation(() => ({
      accounts: () => ({
        accountId: () => ({
          call: jest.fn().mockResolvedValue({ balances: [] })
        })
      })
    }))
  }
}));

describe("StepReview", () => {
  const mockConnect = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockControl: any = {};

  beforeEach(() => {
    jest.clearAllMocks();
    (useWatch as jest.Mock).mockReturnValue({
      name: "Test Token",
      symbol: "TEST",
      decimals: 7,
      initialSupply: 1000,
      adminAddress: "GB...",
    });
  });

  it("renders configuration summary correctly", () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: "GB...",
      connect: mockConnect,
    });

    render(<StepReview control={mockControl} />);

    expect(screen.getByText("Test Token")).toBeInTheDocument();
    expect(screen.getByText("TEST")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
  });

  it("shows 'Connect Wallet to Deploy' CTA when wallet is disconnected", () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: null,
      connect: mockConnect,
    });

    render(<StepReview control={mockControl} />);

    expect(screen.getByText("Wallet Disconnected")).toBeInTheDocument();
    const connectButton = screen.getByText("Connect Wallet to Deploy");
    expect(connectButton).toBeInTheDocument();

    fireEvent.click(connectButton);
    expect(mockConnect).toHaveBeenCalled();
  });

  it("does not show 'Connect Wallet' CTA when wallet is connected", () => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: "GB...",
      connect: mockConnect,
    });

    render(<StepReview control={mockControl} />);

    expect(screen.queryByText("Wallet Disconnected")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect Wallet to Deploy")).not.toBeInTheDocument();
  });
});
