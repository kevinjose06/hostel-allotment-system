from pydantic import BaseModel, EmailStr, ValidationError

class Model(BaseModel):
    email: EmailStr

try:
    # Testing with a trailing space
    m = Model(email="wardenmh1@rit.ac.in ")
    print("Valid!")
except ValidationError as e:
    print(e)
