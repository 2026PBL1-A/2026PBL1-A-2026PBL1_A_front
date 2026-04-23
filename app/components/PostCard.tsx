type Props = {
    id: number,
    title: string,
    datetime: Date,
}

export default function PostCard( {id, title, datetime}:Props ) {
    return (
        <>
        {/* 投稿カード */}
        <div className="border rounded shadow p-4 bg-white">
            <a href={"/post/" + id} className="text-gray-700">
            {/* 見出し */}
            <h2 className="text-lg font-bold mb-2">
                { title }
            </h2>

            <p>{datetime.getFullYear() + "年" + datetime.getMonth() + "月" + datetime.getDay() + "日" + " " + datetime.getHours() + "時" + datetime.getMinutes() + "分"}</p>
          </a>
        </div>
        </>
    )
}