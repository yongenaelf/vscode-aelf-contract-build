import * as vscode from "vscode";
import { PLAYGROUND_URL } from "./common";

export const checkProposalStatus = (context: vscode.ExtensionContext) =>
  vscode.commands.registerCommand(
    "aelf-contract-build.checkProposalStatus",
    async () => {
      // The code you place here will be executed every time your command is executed
      const proposalId = context.globalState.get("proposalId");

      if (typeof proposalId !== "string") {
        vscode.window
          .showErrorMessage("No proposal ID found.", "Deploy contract")
          .then((selection) => {
            if (selection === "Deploy contract") {
              vscode.commands.executeCommand("aelf-contract-build.deploy");
            }
          });
        return;
      }

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Checking status of proposal...",
          cancellable: false,
        },
        async () => {
          try {
            const res = await fetch(
              `${PLAYGROUND_URL}/api/get-proposal-info?id=${proposalId}`
            );
            const { data }: { data: Data } = await res.json();

            if (data.proposal.status !== "released") {
              vscode.window
                .showInformationMessage(
                  `Proposal status: ${data.proposal.status}`,
                  "Check again"
                )
                .then((selection) => {
                  if (selection === "Check again") {
                    vscode.commands.executeCommand(
                      "aelf-contract-build.checkProposalStatus"
                    );
                  }
                });
            }

            const releasedTxId = data.proposal.releasedTxId;
            context.globalState.update("releasedTxId", releasedTxId);

            vscode.commands.executeCommand(
              "aelf-contract-build.checkContractAddress"
            );
          } catch (error) {
            vscode.window
              .showErrorMessage(
                `Contract has not been released yet.`,
                "Check again"
              )
              .then((selection) => {
                if (selection === "Check again") {
                  vscode.commands.executeCommand(
                    "aelf-contract-build.checkProposalStatus"
                  );
                }
              });
          }
        }
      );
    }
  );

interface Data {
  proposal: Proposal;
  bpList: string[];
  organization: Organization;
  parliamentProposerList: any[];
}

interface Proposal {
  createAt: string;
  expiredTime: string;
  approvals: number;
  rejections: number;
  abstentions: number;
  leftInfo: LeftInfo;
  releasedTime: string;
  id: number;
  orgAddress: string;
  createTxId: string;
  proposalId: string;
  proposer: string;
  contractAddress: string;
  contractMethod: string;
  contractParams: string;
  status: string;
  releasedTxId: string;
  createdBy: string;
  isContractDeployed: boolean;
  proposalType: string;
  canVote: boolean;
  votedStatus: string;
}

interface LeftInfo {
  organizationAddress: string;
}

interface Organization {
  createdAt: string;
  updatedAt: string;
  releaseThreshold: ReleaseThreshold;
  leftOrgInfo: LeftOrgInfo;
  orgAddress: string;
  orgHash: string;
  txId: string;
  creator: string;
  proposalType: string;
}

interface ReleaseThreshold {
  minimalApprovalThreshold: string;
  maximalRejectionThreshold: string;
  maximalAbstentionThreshold: string;
  minimalVoteThreshold: string;
}

interface LeftOrgInfo {
  proposerAuthorityRequired: boolean;
  parliamentMemberProposingAllowed: boolean;
  creationToken: any;
}
