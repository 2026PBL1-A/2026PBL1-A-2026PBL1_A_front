export default function NewPost() { 
    return (
        <div>
            <h1>新規投稿</h1>

            <form>
                <h2>タイトル</h2>
                <input type="text" name="title" id="title" required />
                <h2>カテゴリー</h2>
                <label htmlFor="post">投稿</label>
                <input type="radio" name="category" value="投稿" id="post" required />
                <label htmlFor="question">質問</label>
                <input type="radio" name="category" value="質問" id="question" required />
                <h2>投稿内容</h2>
                <textarea></textarea>

                <input type="submit" value="投稿" />
            </form>
        </div>
    );
 }