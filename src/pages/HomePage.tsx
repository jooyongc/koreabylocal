import { Helmet } from "react-helmet-async";

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>코리아바이로컬 - Korea By Local</title>
        <meta
          name="description"
          content="로컬이 추천하는 진짜 한국 여행 경험"
        />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background-gray">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">
            코리아바이로컬
          </h1>
          <p className="text-text-secondary text-lg">
            로컬이 추천하는 진짜 한국 여행 경험
          </p>
          <div className="mt-8 inline-block bg-accent text-white px-6 py-3 rounded-lg font-semibold">
            Coming Soon
          </div>
        </div>
      </div>
    </>
  );
}
