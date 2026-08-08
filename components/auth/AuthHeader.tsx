interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export default function AuthHeader({
  title,
  subtitle,
}: AuthHeaderProps) {
  return (
    <div className="text-center space-y-2">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        {title}
      </h1>

      <p className="text-sm text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}