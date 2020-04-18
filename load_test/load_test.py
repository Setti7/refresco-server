import json
from typing import List

from locust import HttpLocust, TaskSet, task, between


class UserBehaviour(TaskSet):
    token: str
    storesIds: List

    def login(self):
        response = self.client.post(
            "/graphql",
            name='Login',
            headers={
                "Accept": "application/graphql",
                "content-type": "application/json",
                "X-Parse-Application-Id": "9UBUIZ0VeTdGe6YfwEg7KBbL8LSoM8ONAMQyLKzw",
            },
            json={"query": """
                       mutation login {
                           logIn(input: { username: "ansetti7@gmail.com", password: "7porpetas" }) {
                               viewer {
                                   sessionToken
                                   user {
                                       objectId
                                       email
                                       fullName
                                       phone
                                       cpf
                                   }
                               }
                           }
                       }
                   """}
        )
        obj = json.loads(response.content)
        self.token = obj['data']['logIn']['viewer']['sessionToken']

    def logout(self):
        self.client.post(
            "http://localhost:1337/graphql",
            name='Logout',
            headers={
                "Accept": "application/graphql",
                "content-type": "application/json",
                "X-Parse-Application-Id": "9UBUIZ0VeTdGe6YfwEg7KBbL8LSoM8ONAMQyLKzw",
                "X-Parse-Session-Token": self.token
            },
            json={"query": """
                        mutation logOut {
                          logOut(input: { clientMutationId: "logOut" }) {
                            clientMutationId
                          }
                        }
                   """}
        )

    def on_start(self):
        """ on_start is called when a Locust start before any task is scheduled """
        self.login()

    def on_stop(self):
        """ on_stop is called when the TaskSet is stopping """
        self.logout()

    @task(1)
    def get_everything(self):
        response = self.client.post(
            "/graphql",
            name='GetStores',
            headers={
                "Accept": "application/graphql",
                "content-type": "application/json",
                "X-Parse-Application-Id": "9UBUIZ0VeTdGe6YfwEg7KBbL8LSoM8ONAMQyLKzw",
                "X-Parse-Session-Token": self.token
            },
            json={"query": """
                        query getCloseStores {
                          stores(
                            where: {
                              address: {
                                have: {
                                  coordinate: {
                                    nearSphere: { latitude: -22.880539, longitude: -46.970092 }
                                    maxDistanceInKilometers: 10.0
                                  }
                                }
                              }
                            }
                          ) {
                            edges {
                              node {
                                objectId
                                name
                                rating
                                minDeliveryTime
                                maxDeliveryTime
                                address {
                                  coordinate {
                                    latitude
                                    longitude
                                  }
                                }
                              }
                            }
                          }
                        }
                   """}
        )
        storesJson = json.loads(response.content)['data']['stores']['edges']
        self.storesIds = [node['node']['objectId'] for node in storesJson]

        for storeId in self.storesIds:
            for gallonType in ['l10', 'l20']:
                response = self.client.post(
                    "http://localhost:1337/graphql",
                    name='GetGallons',
                    headers={
                        "Accept": "application/graphql",
                        "content-type": "application/json",
                        "X-Parse-Application-Id": "9UBUIZ0VeTdGe6YfwEg7KBbL8LSoM8ONAMQyLKzw",
                        "X-Parse-Session-Token": self.token
                    },
                    json={"query": """
                            query getStoreGallons {
                              gallons(
                                where: {
                                  type: { equalTo: "%s" }
                                  store: { have: { objectId: { equalTo: "%s" } } }
                                }
                              ) {
                                edges {
                                  node {
                                    price
                                    objectId
                                    type
                                    company
                                    store {
                                      objectId
                                    }
                                  }
                                }
                              }
                            }
                           """ % (gallonType, storeId)}
                )


class WebsiteUser(HttpLocust):
    host = 'http://localhost:1337'
    task_set = UserBehaviour
    wait_time = between(5, 9)
