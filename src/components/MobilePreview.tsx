import { useLinks } from "../hooks/useLinks";

interface MobilePreviewProps {
  userId: string | undefined;
  username: string;
}

export const MobilePreview = ({ userId, username }: MobilePreviewProps) => {
  const { links } = useLinks(userId);

  return (
    <div className="w-[300px] h-[600px] border-8 border-gray-800 rounded-[3rem] bg-white overflow-hidden shadow-2xl shrink-0 flex flex-col items-center p-4">
      <div className="text-xl font-bold mt-10">@{username}</div>
      <div className="w-full flex-1 mt-8 space-y-3">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center p-3 border-2 border-indigo-600 rounded-full hover:bg-indigo-50 transition"
          >
            {link.title}
          </a>
        ))}
      </div>
    </div>
  );
};
