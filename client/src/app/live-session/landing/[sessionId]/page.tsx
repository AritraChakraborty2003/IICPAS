import LiveSessionLandingPage from "@/components/LiveSessionLandingPage";

type LiveSessionLandingRouteProps = {
  params: {
    sessionId: string;
  };
};

export default function LiveSessionLandingRoute({
  params,
}: LiveSessionLandingRouteProps) {
  return (
    <LiveSessionLandingPage
      sessionId={params.sessionId}
      previewMode={false}
      showHeader
      showFooter
    />
  );
}
