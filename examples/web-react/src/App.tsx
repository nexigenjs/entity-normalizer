import reactLogo from './assets/react.svg';
import { PostsPaginationExample } from './examples/posts-pagination/PostsPaginationExample';
import './App.css';

function App() {
  return (
    <>
      <div>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <PostsPaginationExample />
    </>
  );
}

export default App;
