import { FixedMath, PositionsEstimate } from '@blend-capital/blend-sdk';
import { Box, Typography, useTheme, Card, CardContent, Chip, LinearProgress, Alert, Snackbar } from '@mui/material';
import { NextPage } from 'next';
import { useEffect, useState, useMemo } from 'react';
import { CustomButton } from '../components/common/CustomButton';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { useWallet } from '../contexts/wallet';
import { useBackstop, usePool, usePoolMeta, usePoolOracle, usePoolUser } from '../hooks/api';

// Bilinen pool'ların listesi - gerçek projenizde bu API'den gelir
const KNOWN_POOLS = [
  'CCOZDRWN6T7EPVJFMZ7S3C4NPJR26BB745GVB46RJDKVNZGBQYBDX5PA', // Ana USDC pool
  'CB7ABQD5M3XJOXS2NNVMHH5JKPMM4XPZRXJF2PJJNKMGCUEJ7BSQAACC', // XLM pool (örnek)
  'CDMLPNYTJPTQKTL5QNXMV7B2ELYKTNZTPWN7FGHBTWK7VN5C2JEMW5B5'  // AQUA pool (örnek)
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

  // Her pool için veri çek
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

  // Pozisyon verilerini hesapla
  const positionData = useMemo(() => {
    if (!connected) return [];
    
    return poolQueries
      .filter(query => query.pool && query.poolOracle && query.poolUser && query.poolMeta)
      .map(({ poolId, pool, poolOracle, poolUser, poolMeta }) => {
                 const positionsEst = PositionsEstimate.build(pool!, poolOracle!, poolUser!.positions);
         
         const collateral = positionsEst.totalEffectiveCollateral;
         const debt = positionsEst.totalBorrowed;
         const ltv = debt > 0 ? (debt / collateral) * 100 : 0;
         
         // Health Factor hesaplama
         const liquidationThreshold = 0.82; // Ortalama liquidation threshold
         const healthFactor = debt > 0 ? (collateral * liquidationThreshold) / debt : 999;
         
         // Risk skoru hesaplama (LTV + düşük health factor risk)
         let riskScore = ltv * 0.8; // LTV'nin %80'i
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
      .filter(pos => pos.debt > 0 || pos.collateral > 0); // Sadece aktif pozisyonları göster
  }, [poolQueries, connected]);

  // Risk uyarısını kontrol et
  useEffect(() => {
    if (positionData.length > 0) {
      const highRiskPositions = positionData.filter(pos => pos.riskScore >= 80);
      
      if (highRiskPositions.length > 0) {
        // Demo Telegram bildirimi
        const message = `🚨 YÜKSEK RİSK UYARISI! ${highRiskPositions.length} pozisyonunuz risk skoru 80+ seviyesinde. Acil aksiyona geçin!`;
        setTelegramNotification(message);
        setShowNotification(true);
        
        // Gerçek implementasyonda burada Telegram API'si çağrılır
        console.log('Telegram Bot Message:', message);
        sendTelegramNotification(message, highRiskPositions);
      }
    }
  }, [positionData]);

  // Telegram bildirimi fonksiyonu
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

  // Overall Health Factor hesaplama
  const totalCollateral = positionData.reduce((sum, pos) => sum + pos.collateral, 0);
  const totalDebt = positionData.reduce((sum, pos) => sum + pos.debt, 0);
  const weightedLiquidationThreshold = positionData.reduce((sum, pos) => 
    sum + (pos.collateral * pos.liquidationThreshold), 0) / (totalCollateral || 1);
  
  const overallHealthFactor = totalDebt > 0 ? 
    (totalCollateral * weightedLiquidationThreshold) / totalDebt : 999;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
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
    if (riskScore < 30) return { label: 'Düşük Risk', color: 'success' };
    if (riskScore < 70) return { label: 'Orta Risk', color: 'warning' };
    return { label: 'Yüksek Risk', color: 'error' };
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
                Risk Analiz & Monitör Sistemi
              </Typography>
              
              <Card sx={{ padding: '24px', maxWidth: '500px' }}>
                <Typography variant="h6" sx={{ marginBottom: '16px' }}>
                  Wallet Bağlantısı Gerekli
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                  Pozisyonlarınızı analiz etmek ve risk skorunuzu hesaplamak için lütfen wallet'ınızı bağlayın.
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
                Risk Analiz & Monitör Sistemi
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
                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                  border: `2px solid ${getHealthFactorColor(overallHealthFactor)}`,
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    color: theme.palette.text.secondary,
                    marginBottom: '12px',
                    fontWeight: 'medium'
                  }}
                >
                  Overall Health Factor
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    color: getHealthFactorColor(overallHealthFactor),
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    fontSize: { xs: '3rem', md: '4rem' }
                  }}
                >
                  {overallHealthFactor > 99 ? '∞' : overallHealthFactor.toFixed(2)}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Toplam Teminat
                    </Typography>
                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                      {formatCurrency(totalCollateral)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Toplam Borç
                    </Typography>
                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                      {formatCurrency(totalDebt)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Genel LTV
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
              Aktif Pozisyonlar ({positionData.length})
            </Typography>

            {/* Positions Grid */}
            {positionData.length > 0 ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fit, minmax(350px, 1fr))' },
                  gap: '20px',
                }}
              >
                {positionData.map((position) => {
                  const riskInfo = getRiskLabel(position.riskScore);
                  
                  return (
                    <Card
                      key={position.poolId}
                      sx={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: '12px',
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      <CardContent sx={{ padding: '24px' }}>
                        {/* Pool Name & Risk Badge */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <Typography
                            variant="h6"
                            sx={{
                              color: theme.palette.text.primary,
                              fontWeight: 'bold',
                            }}
                          >
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
                        <Box sx={{ marginBottom: '20px', textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, marginBottom: '8px' }}>
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

                        {/* Financial Details */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              Teminat:
                            </Typography>
                            <Typography variant="body1" sx={{ color: theme.palette.success.main, fontWeight: 'bold' }}>
                              {formatCurrency(position.collateral)}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              Borç:
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
                              Risk Skoru
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
                  Aktif Pozisyon Bulunamadı
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                  Bu wallet'ta aktif Blend pozisyonu bulunmuyor. Borçlanma veya ödünç verme işlemi yaptıktan sonra pozisyonlarınız burada görünecek.
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
                  Aktif Pozisyon
                </Typography>
              </Card>

              <Card sx={{ padding: '20px', textAlign: 'center', backgroundColor: theme.palette.background.paper }}>
                <Typography variant="h5" sx={{ color: theme.palette.warning.main, fontWeight: 'bold' }}>
                  {positionData.filter(p => p.riskScore >= 80).length}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Yüksek Risk
                </Typography>
              </Card>

              <Card sx={{ padding: '20px', textAlign: 'center', backgroundColor: theme.palette.background.paper }}>
                <Typography variant="h5" sx={{ color: theme.palette.success.main, fontWeight: 'bold' }}>
                  24/7
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Kesintisiz Takip
                </Typography>
              </Card>

              <Card sx={{ padding: '20px', textAlign: 'center', backgroundColor: theme.palette.background.paper }}>
                <Typography variant="h5" sx={{ color: theme.palette.info.main, fontWeight: 'bold' }}>
                  {positionData.length > 0 ? (positionData.reduce((sum, p) => sum + p.riskScore, 0) / positionData.length).toFixed(0) : '0'}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Ortalama Risk
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