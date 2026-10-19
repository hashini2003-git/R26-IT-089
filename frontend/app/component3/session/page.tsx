import { SessionClient } from "./SessionClient";

interface SessionPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined, fallback: string): string {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function SessionPage({ searchParams }: SessionPageProps) {
  const params = await searchParams;

  return (
    <SessionClient
      environment={firstValue(params.environment, "forest")}
      duration={firstValue(params.duration, "10")}
      sound={firstValue(params.sound, "Nature")}
      complexity={firstValue(params.complexity, "Simple")}
    />
  );
}
