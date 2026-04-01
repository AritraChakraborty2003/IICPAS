"use client";

interface ThinHeroSectionProps {
  title: string;
  breadcrumb?: string;
  className?: string;
}

// Add shimmer animation styles
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  .full-ribbon-shine {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), rgba(255,255,255,0.8), rgba(255,255,255,0.6), transparent);
    background-size: 300% 100%;
    animation: shimmer 8s ease-in-out 2;
    animation-delay: 2s;
  }
  
  .glare-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
    background-size: 200% 200%;
    animation: glare 10s ease-in-out 2;
    pointer-events: none;
  }
  
  @keyframes glare {
    0% {
      background-position: -200% -200%;
    }
    50% {
      background-position: 200% 200%;
    }
    100% {
      background-position: -200% -200%;
    }
  }
  
  @keyframes ribbonShine {
    0% {
      background-position: -100% 0;
    }
    100% {
      background-position: 100% 0;
    }
  }
  
  .ribbon-shine {
    background: linear-gradient(90deg, #10b981, #3b82f6);
  }
`;

export default function ThinHeroSection({
  title,
  breadcrumb,
  className,
}: ThinHeroSectionProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmerStyles }} />
      <section className={`relative pt-28 pb-10 ${className ?? ""}`}>
        {/* Full width container without edges */}
        <div className="relative w-full">
          <div className="relative py-3 px-3 md:px-3 text-center ribbon-shine full-ribbon-shine">
            {/* Glare overlay for enhanced shine effect */}
            <div className="glare-overlay"></div>

            {/* Content */}
            <div className="relative z-10 text-left pl-6">
              <h1 className="text-md md:text-xl font-bold text-white relative">
                {/* 4D Effect with multiple shadows */}
                <span
                  className="relative z-10"
                  style={{
                    textShadow: `
                    1px 1px 0px rgba(0,0,0,0.3),
                    2px 2px 0px rgba(0,0,0,0.2),
                    3px 3px 0px rgba(0,0,0,0.1),
                    4px 4px 8px rgba(0,0,0,0.4)
                  `,
                  }}
                >
                  {title}
                </span>
              </h1>
              {breadcrumb && (
                <p className="mt-1 text-sm text-white/90 font-medium">
                  {breadcrumb}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
