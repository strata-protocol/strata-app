/** The disclaimer the ground rules require to be visible in the UI. */
export function TestnetBanner() {
  return (
    <div className="banner" role="note">
      <strong>UNAUDITED · TESTNET ONLY · READ-ONLY.</strong> Nothing here has been reviewed by a
      third party. This dashboard reads Stellar <em>testnet</em> and never moves funds; it has no
      mainnet mode and no wallet. Do not put real funds into Strata.
    </div>
  );
}
