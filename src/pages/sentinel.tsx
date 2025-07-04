import { NextPage } from 'next';
import { useEffect, useState, useMemo } from 'react';
import { useWallet } from '../contexts/wallet';
import { useTheme } from '@mui/material/styles';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Button,
  Alert
} from '@mui/material';
import Image from 'next/image';
import { CustomButton } from '../components/common/CustomButton';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { FixedMath, PositionsEstimate } from '@blend-capital/blend-sdk';
import { useBackstop, usePool, usePoolMeta, usePoolOracle, usePoolUser } from '../hooks/api';
import dynamic from 'next/dynamic';

// Disable SSR for this component
export default dynamic(() => Promise.resolve(Sentinel), {
  ssr: false,
});

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

interface TelegramSubscription {
  walletAddress: string;
  chatId: string;
  riskThreshold: number;
  isActive: boolean;
}

const Sentinel: NextPage = () => {
  const theme = useTheme();
  const { connected, walletAddress } = useWallet();
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  
  // Telegram state - independent from wallet
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState<string>('');
  const [telegramDisplayName, setTelegramDisplayName] = useState<string>('');

  // Load Telegram user from localStorage on component mount
  useEffect(() => {
    const savedTelegramUser = localStorage.getItem('telegramUser');
    if (savedTelegramUser) {
      try {
        const userData = JSON.parse(savedTelegramUser);
        console.log('Loaded Telegram user from localStorage:', userData);
        setTelegramUser(userData);
        setTelegramConnected(true);
        
        // Set display name from saved data
        const displayName = userData.username ? `@${userData.username}` : userData.first_name || 'Telegram User';
        setTelegramDisplayName(displayName);
        setTelegramChatId(userData.id?.toString() || '');
      } catch (error) {
        console.error('Error parsing saved Telegram user:', error);
        localStorage.removeItem('telegramUser');
      }
    }
  }, []);

  // Save Telegram user to localStorage whenever it changes
  useEffect(() => {
    if (telegramUser) {
      localStorage.setItem('telegramUser', JSON.stringify(telegramUser));
      console.log('Saved Telegram user to localStorage:', telegramUser);
    }
  }, [telegramUser]);

  // Telegram Login Widget Callback
  const handleTelegramLogin = async (user: any) => {
    console.log('Telegram Login Widget callback called with user:', user);
    
    try {
      // Call the telegram-login endpoint
      const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${BOT_API_URL}/api/telegram-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramUser: user,
          walletAddress: walletAddress || 'demo_wallet'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Telegram login successful:', result);
        
        // Update state
        setTelegramUser(user);
        setTelegramConnected(true);
        setTelegramChatId(result.subscription.chatId || user.id.toString());
        
        // Set display name
        const displayName = user.username ? `@${user.username}` : user.first_name || 'Telegram User';
        setTelegramDisplayName(displayName);
        
        // Save to localStorage
        localStorage.setItem('telegramUser', JSON.stringify({
          user: user,
          chatId: result.subscription.chatId || user.id.toString(),
          displayName: displayName,
          connectedAt: new Date().toISOString()
        }));
        
        console.log('✅ Telegram user connected:', displayName);
        
        // Show success message
        alert(`✅ Successfully connected to Telegram as ${displayName}!`);
        
      } else {
        console.error('❌ Telegram login failed:', result);
        alert('❌ Failed to connect to Telegram. Please try again.');
      }
      
    } catch (error) {
      console.error('❌ Telegram login error:', error);
      alert('❌ Connection error. Please try again.');
    }
  };

  // Handle message from Telegram iframe
  useEffect(() => {
    const handleTelegramMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://oauth.telegram.org') return;
      
      console.log('Received message from Telegram:', event.data);
      
      if (event.data.user) {
        console.log('User data received from iframe:', event.data.user);
        handleTelegramLogin(event.data.user);
      }
    };

    window.addEventListener('message', handleTelegramMessage);
    
    return () => {
      window.removeEventListener('message', handleTelegramMessage);
    };
  }, [walletAddress]);

  // Global function for Telegram Widget
  useEffect(() => {
    // Make the callback available globally for the Telegram widget
    (window as any).onTelegramAuth = handleTelegramLogin;
    
    // Make manual connect function available globally
    (window as any).handleManualTelegramConnect = () => {
      console.log('Manual Telegram connect clicked');
      const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'blend_sentinel_bot';
      const telegramUrl = `https://t.me/${botUsername}?start=connect_${walletAddress || 'demo'}`;
      window.open(telegramUrl, '_blank');
      
      // Show instruction message
      alert('Please:\n1. Click "START" in the Telegram bot\n2. Return to this page\n3. The connection will be automatic');
    };
    
    // Auto-render widget when not connected
    if (!telegramConnected) {
      setTimeout(() => {
        renderTelegramWidget();
      }, 500); // Small delay to ensure DOM is ready
    }
    
    return () => {
      // Cleanup
      delete (window as any).onTelegramAuth;
      delete (window as any).handleManualTelegramConnect;
    };
  }, [walletAddress, telegramConnected]);

  // Load and render Telegram Widget
  const renderTelegramWidget = () => {
    console.log('renderTelegramWidget called');
    const container = document.getElementById('telegram-login-widget');
    console.log('Container found:', container);
    
    if (container) {
      container.innerHTML = '';
      
      // Use the script approach that user provided
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://telegram.org/js/telegram-widget.js?7';
      script.setAttribute('data-telegram-login', process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'blend_sentinel_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      
      console.log('Creating Telegram widget script with attributes:', {
        'data-telegram-login': process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'blend_sentinel_bot',
        'data-size': 'large',
        'data-onauth': 'onTelegramAuth(user)',
        'data-request-access': 'write'
      });
      
      container.appendChild(script);
      console.log('Telegram widget script added to container');
    } else {
      console.log('Widget container not found');
    }
  };

  // Fetch data for each pool (Fix: Call hooks at top level for each pool)
  const pool1Id = KNOWN_POOLS[0];
  const pool2Id = KNOWN_POOLS[1];
  const pool3Id = KNOWN_POOLS[2];

  // Pool 1 hooks
  const { data: pool1Meta } = usePoolMeta(pool1Id, connected);
  const { data: pool1Data } = usePool(pool1Meta, connected);
  const { data: pool1Oracle } = usePoolOracle(pool1Data, connected);
  const { data: pool1User } = usePoolUser(pool1Data, connected);
  const { data: pool1Backstop } = useBackstop(pool1Meta?.version, connected);

  // Pool 2 hooks
  const { data: pool2Meta } = usePoolMeta(pool2Id, connected);
  const { data: pool2Data } = usePool(pool2Meta, connected);
  const { data: pool2Oracle } = usePoolOracle(pool2Data, connected);
  const { data: pool2User } = usePoolUser(pool2Data, connected);
  const { data: pool2Backstop } = useBackstop(pool2Meta?.version, connected);

  // Pool 3 hooks
  const { data: pool3Meta } = usePoolMeta(pool3Id, connected);
  const { data: pool3Data } = usePool(pool3Meta, connected);
  const { data: pool3Oracle } = usePoolOracle(pool3Data, connected);
  const { data: pool3User } = usePoolUser(pool3Data, connected);
  const { data: pool3Backstop } = useBackstop(pool3Meta?.version, connected);

  // Combine pool data
  const poolData = [
    {
      poolId: pool1Id,
      poolMeta: pool1Meta,
      pool: pool1Data,
      poolOracle: pool1Oracle,
      poolUser: pool1User,
      backstop: pool1Backstop
    },
    {
      poolId: pool2Id,
      poolMeta: pool2Meta,
      pool: pool2Data,
      poolOracle: pool2Oracle,
      poolUser: pool2User,
      backstop: pool2Backstop
    },
    {
      poolId: pool3Id,
      poolMeta: pool3Meta,
      pool: pool3Data,
      poolOracle: pool3Oracle,
      poolUser: pool3User,
      backstop: pool3Backstop
    }
  ];

  // Check existing Telegram subscription (now simplified)
  const checkTelegramSubscription = async () => {
    if (!walletAddress) return;

    try {
      const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${BOT_API_URL}/api/subscription/${walletAddress}`);
      const result = await response.json();
      
      if (result.success && result.subscription) {
        console.log('Existing subscription found:', result.subscription);
        // Note: Don't auto-set Telegram as connected just because wallet has subscription
        // Telegram connection is independent and persisted via localStorage
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  // Disconnect from Telegram
  const handleTelegramDisconnect = () => {
    localStorage.removeItem('telegramUser');
    setTelegramUser(null);
    setTelegramConnected(false);
    setTelegramDisplayName('');
    setTelegramChatId('');
    console.log('Telegram user disconnected');
  };

  // Calculate position data
  const positionData = useMemo(() => {
    if (!connected) return [];
    
    return poolData
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
  }, [connected, 
      pool1Data, pool1Oracle, pool1User, pool1Meta,
      pool2Data, pool2Oracle, pool2User, pool2Meta,
      pool3Data, pool3Oracle, pool3User, pool3Meta
  ]);

  // Check risk alert
  useEffect(() => {
    if (positionData.length > 0 && telegramConnected) {
      const highRiskPositions = positionData.filter(pos => pos.riskScore >= 80);
      
      if (highRiskPositions.length > 0) {
        // Demo Telegram notification
        const message = `🚨 HIGH RISK WARNING! ${highRiskPositions.length} of your positions have risk score 80+ level. Take immediate action!`;
        setShowNotification(true);
        
        // In real implementation, Telegram API would be called here
        console.log('Telegram Bot Message:', message);
        sendTelegramNotification(message, highRiskPositions);
      }
    }
  }, [positionData, telegramConnected]);

  // Telegram notification function
  const sendTelegramNotification = async (message: string, highRiskPositions: PositionData[]) => {
    if (!telegramConnected) return;
    
    try {
      const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3002';
      
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
            {/* Header with Telegram Connect Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
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

              {/* Telegram Connection Status */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-end' }, gap: '12px' }}>
                {/* Telegram Connection - Independent of wallet */}
                {telegramConnected ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {/* Clean Username Button */}
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        padding: '8px 16px',
                        backgroundColor: '#0088cc15',
                        borderRadius: '20px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#0088cc25',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <Image 
                        src="/icons/telegram.svg" 
                        alt="Telegram" 
                        width={18} 
                        height={18}
                        style={{ flexShrink: 0 }}
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#0088cc',
                          fontWeight: '600',
                          fontSize: '14px',
                          letterSpacing: '0.3px'
                        }}
                      >
                        {telegramDisplayName || 'Telegram User'}
                      </Typography>
                    </Box>

                    {/* Subtle Disconnect Button */}
                    <Button
                      onClick={handleTelegramDisconnect}
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: '11px',
                        textTransform: 'none',
                        padding: '2px 8px',
                        minWidth: 'auto',
                        borderRadius: '12px',
                        '&:hover': {
                          backgroundColor: '#FF6B6B15',
                          color: '#FF6B6B'
                        }
                      }}
                    >
                      Disconnect
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '11px', textAlign: 'center' }}>
                      Connect for risk alerts
                    </Typography>
                    
                    {/* Clean Telegram Button */}
                    {!telegramConnected ? (
                      <div 
                        id="telegram-login-widget" 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '40px',
                          minWidth: '200px',
                          borderRadius: '20px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                        }}
                      />
                    ) : (
                      <button 
                        onClick={() => {
                          console.log('Disconnect clicked');
                          // Clear localStorage
                          localStorage.removeItem('telegramUser');
                          // Reset state
                          setTelegramUser(null);
                          setTelegramConnected(false);
                          setTelegramDisplayName('');
                          setTelegramChatId('');
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #0088cc, #00a0db)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 20px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s ease',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                          boxShadow: '0 2px 8px rgba(0, 136, 204, 0.3)',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 136, 204, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0px)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 136, 204, 0.3)';
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.09-.65.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                        </svg>
                        {telegramDisplayName || 'Connected'}
                      </button>
                    )}
                  </Box>
                )}
              </Box>
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
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <Image 
                    src="/icons/telegram.svg" 
                    alt="Telegram" 
                    width={32} 
                    height={32}
                    style={{ 
                      flexShrink: 0,
                      opacity: telegramConnected ? 1 : 0.3,
                      filter: telegramConnected ? 'none' : 'grayscale(100%)'
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {telegramConnected ? 'Telegram Active' : 'Telegram Inactive'}
                </Typography>
              </Card>
            </Box>
          </Box>
        </Section>
      </Row>


    </>
  );
}; 