import { FixedMath, PositionsEstimate } from '@blend-capital/blend-sdk';
import { Box, Typography, useTheme, Card, CardContent, Chip, LinearProgress, Alert, Snackbar } from '@mui/material';
import { NextPage } from 'next';
import { useEffect, useState, useMemo } from 'react';
import { CustomButton } from '../components/common/CustomButton';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { useWallet } from '../contexts/wallet';
import { useBackstop, usePool, usePoolMeta, usePoolOracle, usePoolUser } from '../hooks/api';

// List of known pools - in real project this comes from API
const KNOWN_POOLS = [
  'CCOZDRWN6T7EPVJFMZ7S3C4NPJR26BB745GVB46RJDKVNZGBQYBDX5PA', // Main USDC pool
  'CB7ABQD5M3XJOXS2NNVMHH5JKPMM4XPZRXJF2PJJNKMGCUEJ7BSQAACC', // XLM pool (example)
  'CDMLPNYTJPTQKTL5QNXMV7B2ELYKTNZTPWN7FGHBTWK7VN5C2JEMW5B5'  // AQUA pool (example)
];

interface PositionData {
  poolId: string;
  poolName: string;
  collateral: number;
  debt: number;
  ltv: number;
  riskScore: number;
  liquidationThreshold: number;
  healthFactor: number;
}

const Sentinel: NextPage = () => {
  const theme = useTheme();
  const { connected, walletAddress } = useWallet();
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [telegramNotification, setTelegramNotification] = useState<string>('');
  const [showNotification, setShowNotification] = useState(false);

  // Fetch data for each pool
  const poolQueries = KNOWN_POOLS.map(poolId => {
    const { data: poolMeta } = usePoolMeta(poolId, connected);
    const { data: pool } = usePool(poolMeta, connected);
    const { data: poolOracle } = usePoolOracle(pool, connected);
    const { data: poolUser } = usePoolUser(pool, connected);
    const { data: backstop } = useBackstop(poolMeta?.version, connected);
    
    return {
      poolId,
      poolMeta,
      pool,
      poolOracle,
      poolUser,
      backstop
    };
  });

  // Calculate position data
  const positionData = useMemo(() => {
    if (!connected) return [];
    
    return poolQueries
      .filter(query => query.pool && query.poolOracle && query.poolUser && query.poolMeta)
      .map(({ poolId, pool, poolOracle, poolUser, poolMeta }) => {
         const positionsEst = PositionsEstimate.build(pool!, poolOracle!, poolUser!.positions);
         
         const collateral = positionsEst.totalEffectiveCollateral;
         const debt = positionsEst.totalBorrowed;
         const ltv = debt > 0 ? (debt / collateral) * 100 : 0;
         
         // Health Factor calculation
         const liquidationThreshold = 0.82; // Average liquidation threshold
         const healthFactor = debt > 0 ? (collateral * liquidationThreshold) / debt : 999;
         
         // Risk score calculation (LTV + low health factor risk)
         let riskScore = ltv * 0.8; // 80% of LTV
         if (healthFactor < 1.2) riskScore += 30;
         if (healthFactor < 1.1) riskScore += 20;
         riskScore = Math.min(Math.max(riskScore, 0), 100);

         return {
           poolId,
           poolName: poolMeta!.name || `Pool ${poolId.substring(0, 8)}...`,
          collateral: collateral,
          debt: debt,
          ltv: ltv,
          riskScore: riskScore,
          liquidationThreshold: liquidationThreshold,
          healthFactor: healthFactor
        };
      })
      .filter(pos => pos.debt > 0 || pos.collateral > 0); // Show only active positions
  }, [poolQueries, connected]);

  // Check risk alert
  useEffect(() => {
    if (positionData.length > 0) {
      const highRiskPositions = positionData.filter(pos => pos.riskScore >= 80);
      
      if (highRiskPositions.length > 0) {
        // Demo Telegram notification
        const message = `🚨 HIGH RISK WARNING! ${highRiskPositions.length} of your positions have risk score 80+ level. Take immediate action!`;
        setTelegramNotification(message);
        setShowNotification(true);
        
        // In real implementation, Telegram API would be called here
        console.log('Telegram Bot Message:', message);
        sendTelegramNotification(message, highRiskPositions);
      }
    }
  }, [positionData]);

  // Telegram notification function
  const sendTelegramNotification = async (message: string, highRiskPositions: PositionData[]) => {
    try {
      const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${BOT_API_URL}/api/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          message: message,
          positions: highRiskPositions,
          riskLevel: 'high'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Telegram notification sent successfully!', result);
      } else {
        console.log('⚠️ Telegram notification result:', result);
      }
    } catch (error) {
      console.error('❌ Telegram notification failed:', error);
      // Fallback demo mode
      console.log('🤖 [FALLBACK] Telegram Bot API Call:');
      console.log('Message:', message);
      console.log('High Risk Positions:', highRiskPositions);
    }
  };

  // Overall Health Factor calculation
  const totalCollateral = positionData.reduce((sum, pos) => sum + pos.collateral, 0);
  const totalDebt = positionData.reduce((sum, pos) => sum + pos.debt, 0);
  const weightedLiquidationThreshold = positionData.reduce((sum, pos) => 
    sum + (pos.collateral * pos.liquidationThreshold), 0) / (totalCollateral || 1);
  
  const overallHealthFactor = totalDebt > 0 ? 
    (totalCollateral * weightedLiquidationThreshold) / totalDebt : 999;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore < 30) return theme.palette.success.main;
    if (riskScore < 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getHealthFactorColor = (hf: number) => {
    if (hf > 1.5) return theme.palette.success.main;
    if (hf > 1.2) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore < 30) return { label: 'Low Risk', color: 'success' };
    if (riskScore < 70) return { label: 'Medium Risk', color: 'warning' };
    return { label: 'High Risk', color: 'error' };
  };

  if (!connected) {
    return (
      <>
        <Row>
          <Section width={SectionSize.FULL} sx={{ paddingTop: '12px' }}>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <Typography variant="h3" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                Blend Sentinel
              </Typography>
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                Risk Analysis & Monitoring System
              </Typography>
              
              <Card sx={{ padding: '24px', maxWidth: '500px' }}>
                <Typography variant="h6" sx={{ marginBottom: '16px' }}>
                  Wallet Connection Required
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                  Please connect your wallet to analyze your positions and calculate your risk score.
                </Typography>
              </Card>
            </Box>
          </Section>
        </Row>
      </>
    );
  }

  return (
    <>
      <Row>
        <Section width={SectionSize.FULL} sx={{ paddingTop: '12px' }}>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              padding: '24px',
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', marginBottom: '24px' }}>
              <Typography
                variant="h3"
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 'bold',
                  marginBottom: '8px',
                }}
              >
                Blend Sentinel
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.secondary,
                }}
              >
                Risk Analysis & Monitoring System
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  marginTop: '8px',
                }}
              >
                Wallet: {walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 8)}
              </Typography>
            </Box>

            {/* Overall Health Factor Card */}
            {positionData.length > 0 && (
              <Card
                sx={{
                  padding: '24px',
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant="h5" sx={{ marginBottom: '16px', fontWeight: 'bold' }}>
                  Overall Health Factor
                </Typography>
                
                <Typography
                  variant="h2"
                  sx={{
                    color: getHealthFactorColor(overallHealthFactor),
                    fontWeight: 'bold',
                    marginBottom: '16px',
                  }}
                >
                  {overallHealthFactor > 99 ? '∞' : overallHealthFactor.toFixed(2)}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Total Collateral
                    </Typography>
                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                      {formatCurrency(totalCollateral)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Total Debt
                    </Typography>
                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                      {formatCurrency(totalDebt)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Overall LTV
                    </Typography>
                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                      {totalCollateral > 0 ? ((totalDebt / totalCollateral) * 100).toFixed(1) : '0'}%
                    </Typography>
                  </Box>
                </Box>
              </Card>
            )}

            {/* Positions Title */}
            <Typography
              variant="h4"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 'bold',
                marginTop: '24px',
                marginBottom: '16px',
              }}
            >
              Active Positions ({positionData.length})
            </Typography>

            {/* Positions Grid */}
            {positionData.length > 0 ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                  gap: '20px',
                }}
              >
                {positionData.map((position) => {
                  const riskInfo = getRiskLabel(position.riskScore);
                  
                  return (
                    <Card
                      key={position.poolId}
                      sx={{
                        padding: '0',
                        border: `2px solid ${getRiskColor(position.riskScore)}20`,
                        boxShadow: `0 4px 12px ${getRiskColor(position.riskScore)}15`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 8px 24px ${getRiskColor(position.riskScore)}25`,
                        },
                      }}
                    >
                      <CardContent sx={{ padding: '24px' }}>
                        {/* Pool Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                            {position.poolName}
                          </Typography>
                          <Chip
                            label={riskInfo.label}
                            color={riskInfo.color as any}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>

                        {/* Health Factor */}
                        <Box sx={{ textAlign: 'center', marginBottom: '20px' }}>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, marginBottom: '4px' }}>
                            Health Factor
                          </Typography>
                          <Typography
                            variant="h4"
                            sx={{
                              color: getHealthFactorColor(position.healthFactor),
                              fontWeight: 'bold',
                            }}
                          >
                            {position.healthFactor > 99 ? '∞' : position.healthFactor.toFixed(2)}
                          </Typography>
                        </Box>

                        {/* Position Details */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              Collateral:
                            </Typography>
                            <Typography variant="body1" sx={{ color: theme.palette.success.main, fontWeight: 'bold' }}>
                              {formatCurrency(position.collateral)}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              Debt:
                            </Typography>
                            <Typography variant="body1" sx={{ color: theme.palette.error.main, fontWeight: 'bold' }}>
                              {formatCurrency(position.debt)}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              LTV:
                            </Typography>
                            <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                              {position.ltv.toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>

                        {/* Risk Score Progress */}
                        <Box sx={{ marginTop: '20px' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              Risk Score
                            </Typography>
                            <Typography variant="body2" sx={{ color: getRiskColor(position.riskScore), fontWeight: 'bold' }}>
                              {position.riskScore.toFixed(0)}/100
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={position.riskScore}
                            sx={{
                              height: '8px',
                              borderRadius: '4px',
                              backgroundColor: theme.palette.grey[200],
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getRiskColor(position.riskScore),
                                borderRadius: '4px',
                              },
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            ) : (
              <Card sx={{ padding: '24px', textAlign: 'center' }}>
                <Typography variant="h6" sx={{ marginBottom: '16px' }}>
                  No Active Positions Found
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                  No active Blend positions found in this wallet. Your positions will appear here after borrowing or lending operations.
                </Typography>
              </Card>
            )}

            {/* Summary Stats */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: '16px',
                marginTop: '32px',
              }}
            >
              <Card sx={{ padding: '20px', textAlign: 'center', backgroundColor: theme.palette.background.paper }}>
                <Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                  {positionData.length}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Active Positions
                </Typography>
              </Card>

              <Card sx={{ padding: '20px', textAlign: 'center', backgroundColor: theme.palette.background.paper }}>
                <Typography variant="h5" sx={{ color: theme.palette.warning.main, fontWeight: 'bold' }}>
                  {positionData.filter(p => p.riskScore >= 80).length}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  High Risk
                </Typography>
              </Card>

              <Card sx={{ padding: '20px', textAlign: 'center', backgroundColor: theme.palette.background.paper }}>
                <Typography variant="h5" sx={{ color: theme.palette.success.main, fontWeight: 'bold' }}>
                  24/7
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Continuous Monitoring
                </Typography>
              </Card>

              <Card sx={{ padding: '20px', textAlign: 'center', backgroundColor: theme.palette.background.paper }}>
                <Typography variant="h5" sx={{ color: theme.palette.info.main, fontWeight: 'bold' }}>
                  {positionData.length > 0 ? (positionData.reduce((sum, p) => sum + p.riskScore, 0) / positionData.length).toFixed(0) : '0'}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Average Risk
                </Typography>
              </Card>
            </Box>
          </Box>
        </Section>
      </Row>

      {/* Telegram Notification Snackbar */}
      <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={() => setShowNotification(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowNotification(false)} 
          severity="error" 
          sx={{ width: '100%', minWidth: '300px' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', marginBottom: '8px' }}>
            🤖 Telegram Bot Notification
          </Typography>
          <Typography variant="body2">
            {telegramNotification}
          </Typography>
        </Alert>
      </Snackbar>
    </>
  );
};

export default Sentinel; 