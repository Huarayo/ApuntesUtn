type Props = {
  size?: number;
};

export default function FolderIcon({ size = 20 }: Props) {
  return (
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 48 48"><g fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth={4}><path d="M4 9V41L9 21H39.5V15C39.5 13.8954 38.6046 13 37.5 13H24L19 7H6C4.89543 7 4 7.89543 4 9Z"></path><path fill="#2f88ff" d="M40 41L44 21H8.8125L4 41H40Z"></path></g></svg>
  );
}
