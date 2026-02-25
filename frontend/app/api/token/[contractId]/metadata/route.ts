import { NextRequest, NextResponse } from "next/server";
import { fetchTokenInfo } from "@/lib/stellar";
import { NETWORKS } from "@/types/network";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await params;
    const tokenInfo = await fetchTokenInfo(contractId, NETWORKS.testnet);
    
    return NextResponse.json(tokenInfo);
  } catch (error) {
    console.error("Error fetching token metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch token metadata" },
      { status: 404 }
    );
  }
}