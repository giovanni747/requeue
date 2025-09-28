import { motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './Stack.css';

interface CardRotateProps {
  children: React.ReactNode;
  onSendToBack: () => void;
  sensitivity: number;
  onCardClick?: (roomId: string | number) => void;
  roomId?: string | number;
}

function CardRotate({ children, onSendToBack, sensitivity, onCardClick, roomId }: CardRotateProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(0);

  function handleDragStart() {
    setIsDragging(true);
    setDragStartTime(Date.now());
  }

  function handleDragEnd(_: never, info: { offset: { x: number; y: number } }) {
    const dragDuration = Date.now() - dragStartTime;
    const wasQuickTap = dragDuration < 200 && Math.abs(info.offset.x) < 10 && Math.abs(info.offset.y) < 10;
    
    setIsDragging(false);
    
    if (wasQuickTap && onCardClick && roomId) {
      onCardClick(roomId);
    } else if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
      onSendToBack();
    } else {
      x.set(0);
      y.set(0);
    }
  }

  return (
    <motion.div
      className="card-rotate"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: 'grabbing' }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

interface StackProps {
  randomRotation?: boolean;
  sensitivity?: number;
  cardDimensions?: { width: number; height: number };
  sendToBackOnClick?: boolean;
  cardsData?: { id: string | number; name?: string; img: string }[];
  animationConfig?: { stiffness: number; damping: number };
  onRoomClick?: (roomId: string | number) => void;
}

export default function Stack({
  randomRotation = false,
  sensitivity = 200,
  cardDimensions = { width: 208, height: 208 },
  cardsData = [],
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  onRoomClick
}: StackProps) {
  const router = useRouter();
  const [cards, setCards] = useState(
    cardsData.length
      ? cardsData
      : [
          { id: 1, img: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format' },
          { id: 2, img: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format' },
          { id: 3, img: 'https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format' },
          { id: 4, img: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format' }
        ]
  );
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  useEffect(() => {
    setCards(cardsData);
  }, [cardsData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  const sendToBack = (id: string | number) => {
    setCards(prev => {
      const newCards = [...prev];
      const index = newCards.findIndex(card => card.id === id);
      const [card] = newCards.splice(index, 1);
      newCards.unshift(card);
      return newCards;
    });
  };

  const handleRoomClick = (roomId: string | number) => {
    if (onRoomClick) {
      onRoomClick(roomId);
    } else {
      // Default navigation to room page
      router.push(`/room/${roomId}`);
    }
  };

  const handleSingleClick = (cardId: string | number) => {
    // Clear any existing timeout
    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }
    
    // Set a timeout to execute single click after delay
    const timeout = setTimeout(() => {
      sendToBack(cardId);
      setClickTimeout(null);
    }, 300); // 300ms delay to wait for potential double-click
    
    setClickTimeout(timeout);
  };

  const handleDoubleClick = (cardId: string | number) => {
    // Clear the single click timeout since this is a double-click
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }
    
    // Execute double-click action
    if (sendToBackOnClick) {
      sendToBack(cardId);
    } else {
      handleRoomClick(cardId);
    }
  };

  return (
    <div
      className="stack-container"
      style={{
        width: cardDimensions.width,
        height: cardDimensions.height,
        perspective: 600
      }}
    >
      {cards.map((card, index) => {
        const randomRotate = randomRotation ? Math.random() * 10 - 5 : 0;

        return (
          <CardRotate 
            key={card.id} 
            onSendToBack={() => sendToBack(card.id)} 
            sensitivity={sensitivity}
            onCardClick={sendToBackOnClick ? () => sendToBack(card.id) : handleRoomClick}
            roomId={card.id}
          >
            <motion.div
              className="card relative cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleSingleClick(card.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleDoubleClick(card.id);
              }}
              animate={{
                rotateZ: (cards.length - index - 1) * 4 + randomRotate,
                scale: 1 + index * 0.06 - cards.length * 0.06,
                transformOrigin: '90% 90%'
              }}
              initial={false}
              transition={{
                type: 'spring',
                stiffness: animationConfig.stiffness,
                damping: animationConfig.damping
              }}
              style={{
                width: cardDimensions.width,
                height: cardDimensions.height
              }}
            >
              <img src={card.img} alt={`card-${card.id}`} className="card-image" />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center">
                <h3 className="text-white text-xl font-bold text-center px-4">
                  {card.name || `Room ${card.id}`}
                </h3>
                <p className="text-white text-sm opacity-75 mt-2">
                  Click to reorder • Double-click to enter
                </p>
              </div>
            </motion.div>
          </CardRotate>
        );
      })}
    </div>
  );
}
