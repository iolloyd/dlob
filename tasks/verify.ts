// tasks/verify.ts
import { task } from "hardhat/config";
import { verifyContract, verifyContractWithRetry } from "../deploy/utils/verify";
import chalk from "chalk";

task("verify-all", "Verifies all deployed contracts")
    .setAction(async (_, hre) => {
        const { deployments } = hre;
        const allDeployments = await deployments.all();

        console.log(chalk.blue("\nVerifying all contracts..."));

        for (const [name, deployment] of Object.entries(allDeployments)) {
            console.log(chalk.yellow(`\nVerifying ${name}...`));
            try {
                await verifyContractWithRetry(
                    deployment.address,
                    {
                        contract: deployment.contract,
                        constructorArguments: deployment.args || [],
                    },
                    hre
                );
                console.log(chalk.green(`✓ ${name} verified successfully`));
            } catch (error: any) {
                console.error(chalk.red(`✘ Failed to verify ${name}:`));
                console.error(error.message);
            }
        }
    });

task("verify-proxy", "Verifies a proxy contract and its implementation")
    .addParam("address", "Proxy contract address")
    .addParam("impl", "Implementation contract name")
    .setAction(async (taskArgs, hre) => {
        console.log(chalk.blue("\nVerifying proxy contract..."));

        try {
            // Verify proxy contract
            await verifyContract(
                taskArgs.address,
                {
                    contract: "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy"
                },
                hre
            );

            // Get implementation address
            const implAddress = await hre.upgrades.erc1967.getImplementationAddress(
                taskArgs.address
            );

            console.log(chalk.yellow("\nVerifying implementation contract..."));

            // Verify implementation
            await verifyContract(
                implAddress,
                {
                    contract: `contracts/${taskArgs.impl}.sol:${taskArgs.impl}`
                },
                hre
            );

            console.log(chalk.green("\nProxy and implementation verified successfully!"));
        } catch (error: any) {
            console.error(chalk.red("Verification failed:"));
            console.error(error.message);
        }
    });