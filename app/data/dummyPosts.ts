export type Post = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  type: "creation" | "question"; // 制作物か質問か
};

export const dummyPosts: Post[] = [
  {
    id: "1",
    title: "はじめての投稿",
    content: "これは最初のダミー投稿です。詳細画面への遷移テストです。\n\n改行も含めてきちんと表示されるか確認します。",
    type: "creation",
  },
  {
    id: "2",
    title: "Next.jsのエラーについて",
    content: "ダミーデータを使って一覧画面と詳細画面を作成していますが、ルーティングでエラーが出ます。解決方法を教えてください。",
    type: "question",
  },
  {
    id: "3",
    title: "デザインの調整",
    content: "UIの作成が順調に進んでいます。\nTailwind CSSを利用してレスポンシブな画面を作成する予定です。",
    type: "creation",
  }
];
