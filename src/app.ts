import createError from 'http-errors';
import 'dotenv/config'
import express, {ErrorRequestHandler} from "express";
import path from "path";
import { router as indexRouter } from "./routes";
import cookieParser from "cookie-parser";
import logger from "morgan";
import livereload from "livereload";
import connectLivereload from "connect-livereload";

if (process.env.debug) {
  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(__dirname);
  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 100);
  });
}

const app = express();
if (process.env.debug)
  app.use(connectLivereload());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use(((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
}) as ErrorRequestHandler);

module.exports = app;
