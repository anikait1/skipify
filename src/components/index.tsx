import { FC } from "hono/jsx";
import { CurrentlyPlaying } from "./currently-playing";

const DummyLayout: FC = (props) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Skipify</title>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN"
          crossorigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
        />
        <script src="https://unpkg.com/htmx.org@1.9.6"></script>
      </head>
      <body>
        <main class="container mt-5">
          <div class="row">
            <CurrentlyPlaying currentTrack={props.currentTrack} startPoll={false} />
            <section class="col-6"></section>
            <section class="col-3"></section>
          </div>
        </main>
      </body>
    </html>
  );
};

// const HomePage: FC = (props) => {
//   return (
//     <Layout>
//       <div class="row">
//         <div className="class"></div>
//         <div class="col-md-6 offset-md-3">
//           <div class="card">
//             <div class="card-body">
//               <h5 class="card-title">
//                 <strong>Skipify</strong>
//               </h5>
//               <p class="card-text">
//                 Skipify is a web app that allows you to skip to the next song in
//                 your Spotify playlist.
//               </p>
//               <a href="/auth" class="btn btn-primary">
//                 Get Started
//               </a>
//             </div>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// }

export default DummyLayout;
