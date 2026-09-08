export const usdtAbi = [
    {
        type: "function",
        name: "mint",
        stateMutability: "nonpayable",
        inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        type: "function",
        name: "allowance",
        stateMutability: "view",
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
        ],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        type: "function",
        name: "approve",
        stateMutability: "nonpayable",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
    {
        type: "function",
        name: "nonces",
        stateMutability: "view",
        inputs: [{ name: "owner", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        type: "function",
        name: "name",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
    },
    {
        type: "function",
        name: "transferWithPermit",
        stateMutability: "nonpayable",
        inputs: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "deadline", type: "uint256" },
            { name: "v", type: "uint8" },
            { name: "r", type: "bytes32" },
            { name: "s", type: "bytes32" },
        ],
        outputs: [],
    },
] as const

export const permit2Abi = [
    {
        type: "function",
        name: "permitTransferFrom",
        stateMutability: "nonpayable",
        inputs: [
            {
                name: "permit",
                type: "tuple",
                components: [
                    {
                        name: "permitted",
                        type: "tuple",
                        components: [
                            { name: "token", type: "address" },
                            { name: "amount", type: "uint256" },
                        ],
                    },
                    { name: "nonce", type: "uint256" },
                    { name: "deadline", type: "uint256" },
                ],
            },
            {
                name: "transferDetails",
                type: "tuple",
                components: [
                    { name: "to", type: "address" },
                    { name: "requestedAmount", type: "uint256" },
                ],
            },
            { name: "owner", type: "address" },
            { name: "signature", type: "bytes" },
        ],
        outputs: [],
    },
] as const

export const swVaultAbi = [
    {
        type: "function",
        name: "joinWithPermit",
        stateMutability: "nonpayable",
        inputs: [
            { name: "player", type: "address" },
            { name: "lobbyPathHash", type: "bytes32" },
            { name: "amount", type: "uint256" },
            { name: "deadline", type: "uint256" },
            { name: "v", type: "uint8" },
            { name: "r", type: "bytes32" },
            { name: "s", type: "bytes32" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "joinWithPermit2",
        stateMutability: "nonpayable",
        inputs: [
            { name: "player", type: "address" },
            { name: "lobbyPathHash", type: "bytes32" },
            { name: "amount", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
            { name: "signature", type: "bytes" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "leaveSeat",
        stateMutability: "nonpayable",
        inputs: [
            { name: "player", type: "address" },
            { name: "lobbyPathHash", type: "bytes32" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "kick",
        stateMutability: "nonpayable",
        inputs: [
            { name: "player", type: "address" },
            { name: "lobbyPathHash", type: "bytes32" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "claim",
        stateMutability: "nonpayable",
        inputs: [
            { name: "player", type: "address" },
            { name: "lobbyPathHash", type: "bytes32" },
            { name: "amount", type: "uint256" },
            { name: "dest", type: "address" },
            { name: "destFeePct", type: "uint8" },
        ],
        outputs: [],
    },
] as const
