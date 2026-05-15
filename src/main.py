import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from helpers.database import close_db, init_db

from routes import base_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    await init_db()
    yield
    # shutdown
    await close_db()


app = FastAPI(
    title="My FastAPI Application Backend about Smart Attendance ",
    version="0.1.0",
    lifespan=lifespan,
    # redirect_slashes=False,
    redirect_slashes=True,
)

# Allow frontend dev server to call API during local development.
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(base_router)


if __name__ == "__main__":

    uvicorn.run(app, host="0.0.0.0", port=8000)


"""
TODO [first][done]: database connection and database schema
    understand the SQl database 
    ORM -> Object Relational Mapping (SQLAlchemy) -> convert OOP to database tables 
    engine -> the connection to the database (URL) bridge between python and database
    session -> the communication channel with the database (manage connections, track objects (identity map), buffer changes, handle transactions (flush/commit/rollback).)
    base(declarative base) -> the base class for all ORM models (tables) will convert python classes to database tables(metadata)
    
    -> models (tables) -> CRUD operations
    
TODO: auth(login+roles) :Next step I recommend: add RBAC + auth guards on these endpoints (admin, instructor, device) and then Postman collection tests for the full check-in flow

TODO : start and stop attendance
FIXME
"""


"""
sudo lsof -i tcp:5432
sudo kill -9 2795
hostname -I
"""
"""
TODO(5/7)[]:i 
                [] i first show the session active -> then i want mange the session by closed the session 
                [] 2 - i want when the session time out -> close  
                [] 3- history page : not's appear the section id and session id , and appear who attend in each session check that on backend and  frontend  
                [] 4- in /student page : when click the student show the window for show the details has student also show the history of attendance 
                [] 5- i want mange the application by telegram bot , each instructor has the own bot telegram and the instructor mange that through that , 
                    - /start - > for start deal with app - show the /auth for authentication 
                    - /auth  -> write the password for auth 
                    -/list_course - show all course own this instructor
                    -/enter_course 
                    -/start_session 
                    -/time_session 
                    -/closed 
                    -/check-in-manual
"""
